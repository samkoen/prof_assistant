import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControl,
  Radio,
  Typography,
} from "@mui/material";
import { OptionText } from "../../components/MultilineOptionLayout";
import QuestionImageDisplay from "../../components/QuestionImageDisplay";
import { examQuestionLtrSx } from "../../components/examQuestionLtrStyles";
import QuestionTextWithIndex from "../../components/QuestionTextWithIndex";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import {
  api,
  ApiError,
  type ExamAttempt,
  type ExamReview,
  type ExamTake,
  type PracticeResult,
  type StudentQuestion,
} from "../../api/client";
import ExamSubmissionReview from "../../components/ExamSubmissionReview";
import ExamScoresPanel from "../../components/ExamScoresPanel";
import ExamFocusOverlay from "../../components/ExamFocusOverlay";
import ExamIntegrityRulesDialog from "../../components/ExamIntegrityRulesDialog";
import StudentExamQuestionNav from "../../components/StudentExamQuestionNav";
import { useExamIntegrity } from "../../hooks/useExamIntegrity";
import { useExamQuestionScrollSpy } from "../../hooks/useExamQuestionScrollSpy";
import { he } from "../../i18n/he";
import {
  hebrewAlignRightSx,
  hebrewPageToolbarSx,
  hebrewToolbarTitleSx,
} from "../../styles/hebrewAlign";
import { examQuestionScrollMarginTop } from "../../styles/layoutOffsets";
import {
  contentDirForQuestionText,
  formatExamPointsLabel,
} from "../../utils/examQuestionsLanguage";
import { studentCourseExamsPath } from "../../utils/studentCourseExamsNav";
import {
  countAnsweredQuestions,
  examQuestionElementId,
  findNextUnansweredIndex,
  isQuestionAnswered,
  scrollToExamQuestion,
} from "../../utils/studentExamQuestionNav";
import {
  clearExamSessionToken,
  examSessionTokenHeaders,
  rememberAttemptSessionToken,
} from "../../utils/examSessionToken";

function answersFromSaved(saved: ExamTake["saved_answers"]): Record<number, number[]> {
  const out: Record<number, number[]> = {};
  for (const row of saved ?? []) {
    out[row.question_id] = row.selected_option_ids;
  }
  return out;
}

function buildAnswersPayload(
  questions: StudentQuestion[],
  answers: Record<number, number[]>,
) {
  return {
    answers: questions.map((q) => ({
      question_id: q.id,
      selected_option_ids: answers[q.id] ?? [],
    })),
  };
}

function formatRemaining(expiresAt: string | null): string {
  if (!expiresAt) return "—";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

type PagePhase = "exam" | "final" | "practice" | "practice_review";

export default function StudentExamTakePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const id = Number(sessionId);
  const [paper, setPaper] = useState<ExamTake | null>(null);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startingPractice, setStartingPractice] = useState(false);
  const [acceptingRules, setAcceptingRules] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [review, setReview] = useState<ExamReview | null>(null);
  const [practiceResults, setPracticeResults] = useState<PracticeResult[]>([]);
  const [phase, setPhase] = useState<PagePhase>("exam");
  const [timeLeft, setTimeLeft] = useState("");
  const [tabHidden, setTabHidden] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const paperRef = useRef<ExamTake | null>(null);
  const answersRef = useRef<Record<number, number[]>>({});
  const submittingRef = useRef(false);
  paperRef.current = paper;
  answersRef.current = answers;

  const loadPracticeHistory = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    try {
      setPracticeResults(
        await api<PracticeResult[]>(`/api/exams/sessions/${id}/practice/history`),
      );
    } catch {
      setPracticeResults([]);
    }
  }, [id]);

  const loadReview = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    try {
      setReview(await api<ExamReview>(`/api/exams/sessions/${id}/review`));
    } catch (e) {
      setReview(null);
      if (e instanceof ApiError) {
        setError(e.message);
      }
    }
    await loadPracticeHistory();
  }, [id, loadPracticeHistory]);

  const loadPracticeReview = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    try {
      setReview(await api<ExamReview>(`/api/exams/sessions/${id}/practice/review`));
    } catch {
      setReview(null);
    }
    await loadPracticeHistory();
  }, [id, loadPracticeHistory]);

  const loadPractice = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<ExamTake>(`/api/exams/sessions/${id}/practice/take`);
      setPaper(data);
      setAttempt(data.attempt);
      setPhase("practice");
      setReview(null);
      setSuccess("");
      setAutoSubmitted(false);
      setAnswers(answersFromSaved(data.saved_answers));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<ExamTake>(`/api/exams/sessions/${id}/take`, {
        headers: examSessionTokenHeaders(id),
      });
      rememberAttemptSessionToken(id, data.attempt);
      setPaper(data);
      setAttempt(data.attempt);
      if (data.attempt.submitted_at) {
        clearExamSessionToken(id);
        const timedOut =
          !!data.attempt.expires_at &&
          new Date(data.attempt.expires_at).getTime() <= Date.now();
        setSuccess(timedOut ? he.examAutoSubmitted : he.examSubmitted);
        setAutoSubmitted(timedOut);
        setPhase("final");
        await loadReview();
      } else if (data.attempt.practice_active) {
        await loadPractice();
      } else {
        setPhase("exam");
        setReview(null);
        setAutoSubmitted(false);
        setSuccess("");
        setAnswers(answersFromSaved(data.saved_answers));
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [id, loadReview, loadPractice]);

  useEffect(() => {
    load();
  }, [load]);

  const integrityActive = !!paper?.integrity_mode_enabled;
  const rulesAcceptedAt = attempt?.rules_accepted_at ?? paper?.attempt.rules_accepted_at;
  const rulesPending =
    integrityActive && paper && !rulesAcceptedAt && !paper.attempt.submitted_at && phase === "exam";
  const submitted = phase === "final" || phase === "practice_review";
  const examInProgress = integrityActive && !!attempt?.started_at && phase === "exam";

  useExamIntegrity(examInProgress, attempt?.id ?? null, id || null, submitted);

  useEffect(() => {
    if (!examInProgress) return;
    const sync = () => setTabHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [examInProgress]);

  useEffect(() => {
    if (!attempt?.expires_at || attempt.submitted_at) return;
    const tick = () => setTimeLeft(formatRemaining(attempt.expires_at));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [attempt?.expires_at, attempt?.submitted_at]);

  const acceptRules = async () => {
    setAcceptingRules(true);
    setError("");
    try {
      const res = await api<ExamAttempt>(`/api/exams/sessions/${id}/accept-rules`, {
        method: "POST",
        headers: examSessionTokenHeaders(id),
      });
      rememberAttemptSessionToken(id, res);
      setAttempt(res);
      setPaper((prev) =>
        prev ? { ...prev, attempt: { ...prev.attempt, ...res } } : prev
      );
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setAcceptingRules(false);
    }
  };

  const setSingle = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: [optionId] }));
  };

  const toggleMultiple = (questionId: number, optionId: number, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      const next = checked ? [...current, optionId] : current.filter((x) => x !== optionId);
      return { ...prev, [questionId]: next };
    });
  };

  const saveDraft = useCallback(async () => {
    const p = paperRef.current;
    const a = answersRef.current;
    if (!p?.questions.length) return;
    const path =
      phase === "practice"
        ? `/api/exams/sessions/${id}/practice/answers`
        : `/api/exams/sessions/${id}/answers`;
    if (phase !== "practice" && p.attempt.submitted_at) return;
    const headers =
      phase === "practice" ? undefined : examSessionTokenHeaders(id);
    await api(path, {
      method: "PUT",
      headers,
      body: JSON.stringify(buildAnswersPayload(p.questions, a)),
    });
  }, [id, phase]);

  useEffect(() => {
    if (phase !== "exam" && phase !== "practice") return;
    if (rulesPending || !paper?.questions.length) return;
    const t = window.setTimeout(() => {
      saveDraft().catch((e) => {
        if (e instanceof ApiError && e.status === 409) {
          setError(e.message || he.examSessionTakenElsewhere);
        }
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [answers, phase, rulesPending, paper?.session_id, saveDraft]);

  const startPractice = async () => {
    setStartingPractice(true);
    setError("");
    try {
      const res = await api<ExamAttempt>(`/api/exams/sessions/${id}/practice/start`, {
        method: "POST",
      });
      setAttempt(res);
      await loadPractice();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setStartingPractice(false);
    }
  };

  const submitPractice = useCallback(async () => {
    const p = paperRef.current;
    const a = answersRef.current;
    if (!p?.questions.length || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const payload = buildAnswersPayload(p.questions, a);
      const res = await api<ExamAttempt>(`/api/exams/sessions/${id}/practice/submit`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAttempt(res);
      setSuccess(he.practiceSubmitted);
      setPhase("practice_review");
      await loadPracticeReview();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [id, loadPracticeReview]);

  const submit = useCallback(
    async (force = false) => {
      const p = paperRef.current;
      const a = answersRef.current;
      if (!p?.questions.length || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setError("");
      try {
        const payload = buildAnswersPayload(p.questions, a);
        const headers = examSessionTokenHeaders(id);
        await api(`/api/exams/sessions/${id}/answers`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
        const res = await api<ExamAttempt>(`/api/exams/sessions/${id}/submit`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        clearExamSessionToken(id);
        setAttempt(res);
        setPaper((prev) => (prev ? { ...prev, attempt: { ...prev.attempt, ...res } } : prev));
        setSuccess(force ? he.examAutoSubmitted : he.examSubmitted);
        setAutoSubmitted(force);
        setPhase("final");
        await loadReview();
      } catch (e) {
        setError(e instanceof ApiError ? e.message : he.errorGeneric);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [id, loadReview],
  );

  useEffect(() => {
    if (
      phase !== "exam" ||
      !paper?.auto_submit_on_timeout ||
      !attempt?.expires_at ||
      attempt.submitted_at ||
      submitting ||
      rulesPending
    ) {
      return;
    }
    const ms = new Date(attempt.expires_at).getTime() - Date.now();
    if (ms <= 0) {
      submit(true);
      return;
    }
    const t = window.setTimeout(() => submit(true), ms);
    return () => window.clearTimeout(t);
  }, [
    attempt?.expires_at,
    attempt?.submitted_at,
    submitting,
    phase,
    paper?.session_id,
    paper?.auto_submit_on_timeout,
    rulesPending,
    submit,
  ]);

  const showTimeWarning =
    phase === "exam" &&
    paper &&
    attempt?.expires_at &&
    !rulesPending &&
    (() => {
      const remainingMin = (new Date(attempt.expires_at).getTime() - Date.now()) / 60000;
      return remainingMin > 0 && remainingMin <= paper.warning_minutes;
    })();

  const showExamNav = phase === "exam" && !rulesPending && (paper?.questions.length ?? 0) > 0;
  const activeQuestionIndex = useExamQuestionScrollSpy(paper?.questions.length ?? 0, showExamNav);
  const answeredCount = paper ? countAnsweredQuestions(paper.questions, answers) : 0;
  const allQuestionsAnswered =
    !!paper && paper.questions.length > 0 && answeredCount >= paper.questions.length;

  const goToQuestion = (index: number) => {
    scrollToExamQuestion(index);
  };

  const goNextUnanswered = () => {
    if (!paper) return;
    const next = findNextUnansweredIndex(paper.questions, answers, activeQuestionIndex);
    if (next != null) scrollToExamQuestion(next);
  };

  if (loading && !paper) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!paper) {
    return <Alert severity="error">{error || he.errorGeneric}</Alert>;
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <ExamFocusOverlay visible={examInProgress && tabHidden} />
      <ExamIntegrityRulesDialog
        open={!!rulesPending}
        examTitle={paper.exam_title}
        loading={acceptingRules}
        onAccept={acceptRules}
      />

      {paper && (
        <Button
          component={RouterLink}
          to={studentCourseExamsPath(paper.offering_id, id)}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mb: 2 }}
        >
          {he.backToCourseExams}
        </Button>
      )}

      <Box sx={{ ...hebrewPageToolbarSx, mb: 2, alignItems: "flex-start" }}>
        <Box sx={hebrewToolbarTitleSx}>
          <Typography variant="h5" fontWeight={700}>
            {paper.exam_title}
          </Typography>
          {paper.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {paper.description}
            </Typography>
          )}
        </Box>
        {!submitted && attempt?.started_at && phase === "exam" && (
          <Typography variant="h6" color="primary" fontWeight={700} sx={{ flexShrink: 0 }}>
            {he.timeRemaining}: {timeLeft}
          </Typography>
        )}
      </Box>

      {showTimeWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {he.timeWarning} {paper.warning_minutes} {he.minutes}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 2,
            ...hebrewAlignRightSx,
            "& .MuiAlert-message": {
              width: "100%",
              textAlign: "right",
              direction: "rtl",
            },
          }}
        >
          {success}
        </Alert>
      )}

      {phase === "exam" && !submitted && integrityActive && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {he.examOfficialModeHint}
        </Alert>
      )}

      {phase === "practice" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {he.practiceModeHint}
        </Alert>
      )}

      {submitted ? (
        <>
          {attempt && (
            <ExamScoresPanel
              attempt={attempt}
              practiceResults={practiceResults}
              resultsPublished={Boolean(
                review?.results_published ?? paper.results_published,
              )}
            />
          )}
          {review && <ExamSubmissionReview review={review} />}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
            {(phase === "final" || phase === "practice_review") && (
              <Button
                variant="contained"
                color="success"
                onClick={startPractice}
                disabled={startingPractice}
              >
                {startingPractice ? he.loading : he.startPracticeExam}
              </Button>
            )}
            <Button
              component={RouterLink}
              to={paper ? studentCourseExamsPath(paper.offering_id, id) : "/student/courses"}
              variant="outlined"
            >
              {he.backToCourseExams}
            </Button>
          </Box>
        </>
      ) : rulesPending ? null : phase === "practice" ? (
        <>
          {paper.questions.map((q, i) => (
            <QuestionBlock
              key={q.id}
              elementId={`practice-question-${i + 1}`}
              index={i + 1}
              question={q}
              selected={answers[q.id] ?? []}
              onSingle={setSingle}
              onToggle={toggleMultiple}
            />
          ))}
          <Button
            variant="contained"
            size="large"
            onClick={() => submitPractice()}
            disabled={submitting}
            sx={{ mt: 2 }}
          >
            {submitting ? he.loading : he.submitPracticeExam}
          </Button>
        </>
      ) : (
        <>
          {showExamNav && (
            <StudentExamQuestionNav
              questions={paper.questions}
              answers={answers}
              activeIndex={activeQuestionIndex}
              onSelectQuestion={goToQuestion}
              onNextUnanswered={goNextUnanswered}
              allAnswered={allQuestionsAnswered}
            />
          )}
          {paper.questions.map((q, i) => (
            <QuestionBlock
              key={q.id}
              elementId={examQuestionElementId(i + 1)}
              index={i + 1}
              question={q}
              selected={answers[q.id] ?? []}
              answered={isQuestionAnswered(answers, q.id)}
              onSingle={setSingle}
              onToggle={toggleMultiple}
            />
          ))}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2, alignItems: "center" }}>
            <Button
              variant="outlined"
              startIcon={<SkipNextIcon />}
              onClick={goNextUnanswered}
              disabled={allQuestionsAnswered}
            >
              {allQuestionsAnswered ? he.examAllQuestionsAnswered : he.examNextUnanswered}
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => submit()}
              disabled={submitting}
            >
              {submitting ? he.loading : he.submitExam}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {he.submitExamPartialHint}
          </Typography>
          {autoSubmitted && (
            <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
              {he.examAutoSubmittedHint}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}

function QuestionBlock({
  elementId,
  index,
  question,
  selected,
  answered,
  onSingle,
  onToggle,
}: {
  elementId: string;
  index: number;
  question: StudentQuestion;
  selected: number[];
  answered?: boolean;
  onSingle: (questionId: number, optionId: number) => void;
  onToggle: (questionId: number, optionId: number, checked: boolean) => void;
}) {
  const isMultiple = question.question_type === "multiple";
  const qDir = contentDirForQuestionText(question.text);
  const ltr = qDir === "ltr";
  const pointsLabel = formatExamPointsLabel(question.points, qDir);

  return (
    <Card
      id={elementId}
      sx={{
        mb: 2,
        scrollMarginTop: examQuestionScrollMarginTop,
        ...(answered && {
          borderInlineStart: (theme) => `4px solid ${theme.palette.success.main}`,
          bgcolor: "rgba(76, 175, 80, 0.04)",
        }),
      }}
    >
      <CardContent dir={qDir} sx={ltr ? examQuestionLtrSx : { textAlign: "right" }}>
        <QuestionTextWithIndex index={index} text={question.text} gutterBottom>
          {" "}
          <Typography component="span" variant="body2" color="text.secondary">
            ({pointsLabel})
          </Typography>
        </QuestionTextWithIndex>
        <QuestionImageDisplay url={question.image_url} />
        {isMultiple ? (
          <Box>
            {question.options.map((o) => (
              <Box
                key={o.id}
                component="label"
                sx={{
                  display: "block",
                  mb: 1.5,
                  cursor: "pointer",
                  borderRadius: 1,
                  "&:hover": { bgcolor: "action.hover" },
                  ...(ltr ? { textAlign: "left" } : { textAlign: "right" }),
                }}
              >
                <Box sx={{ direction: "ltr", display: "inline-flex" }}>
                  <Checkbox
                    checked={selected.includes(o.id)}
                    onChange={(e) => onToggle(question.id, o.id, e.target.checked)}
                    sx={{ p: 0.5 }}
                  />
                </Box>
                <OptionText text={o.text} imageUrl={o.image_url} questionText={question.text} />
              </Box>
            ))}
          </Box>
        ) : (
          <FormControl component="fieldset" fullWidth>
            {question.options.map((o) => (
              <Box
                key={o.id}
                component="label"
                sx={{
                  display: "block",
                  mb: 1.5,
                  cursor: "pointer",
                  borderRadius: 1,
                  "&:hover": { bgcolor: "action.hover" },
                  ...(ltr ? { textAlign: "left" } : { textAlign: "right" }),
                }}
              >
                <Box sx={{ direction: "ltr", display: "inline-flex" }}>
                  <Radio
                    checked={selected[0] === o.id}
                    onChange={() => onSingle(question.id, o.id)}
                    sx={{ p: 0.5 }}
                  />
                </Box>
                <OptionText text={o.text} imageUrl={o.image_url} questionText={question.text} />
              </Box>
            ))}
          </FormControl>
        )}
      </CardContent>
    </Card>
  );
}
