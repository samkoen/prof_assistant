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
import {
  api,
  ApiError,
  type ExamAttempt,
  type ExamReview,
  type ExamTake,
  type StudentQuestion,
} from "../../api/client";
import ExamSubmissionReview from "../../components/ExamSubmissionReview";
import ExamFocusOverlay from "../../components/ExamFocusOverlay";
import ExamIntegrityRulesDialog from "../../components/ExamIntegrityRulesDialog";
import { useExamIntegrity } from "../../hooks/useExamIntegrity";
import { he } from "../../i18n/he";
import {
  hebrewAlignRightSx,
  hebrewPageToolbarSx,
  hebrewToolbarTitleSx,
} from "../../styles/hebrewAlign";
import {
  contentDirForQuestionText,
  formatExamPointsLabel,
} from "../../utils/examQuestionsLanguage";

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

export default function StudentExamTakePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const id = Number(sessionId);
  const [paper, setPaper] = useState<ExamTake | null>(null);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acceptingRules, setAcceptingRules] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [review, setReview] = useState<ExamReview | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [tabHidden, setTabHidden] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const paperRef = useRef<ExamTake | null>(null);
  const answersRef = useRef<Record<number, number[]>>({});
  const submittingRef = useRef(false);
  paperRef.current = paper;
  answersRef.current = answers;

  const loadReview = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    try {
      setReview(await api<ExamReview>(`/api/exams/sessions/${id}/review`));
    } catch {
      setReview(null);
    }
  }, [id]);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<ExamTake>(`/api/exams/sessions/${id}/take`);
      setPaper(data);
      setAttempt(data.attempt);
      if (data.attempt.submitted_at) {
        const timedOut =
          !!data.attempt.expires_at &&
          new Date(data.attempt.expires_at).getTime() <= Date.now();
        setSuccess(timedOut ? he.examAutoSubmitted : he.examSubmitted);
        setAutoSubmitted(timedOut);
        await loadReview();
      } else {
        setReview(null);
        setAutoSubmitted(false);
        setAnswers(answersFromSaved(data.saved_answers));
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [id, loadReview]);

  useEffect(() => {
    load();
  }, [load]);

  const integrityActive = !!paper?.integrity_mode_enabled;
  const rulesAcceptedAt = attempt?.rules_accepted_at ?? paper?.attempt.rules_accepted_at;
  const rulesPending =
    integrityActive && paper && !rulesAcceptedAt && !paper.attempt.submitted_at;
  const submitted = !!attempt?.submitted_at;
  const examInProgress = integrityActive && !!attempt?.started_at && !submitted;

  useExamIntegrity(examInProgress, attempt?.id ?? null, submitted);

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
      });
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
    if (!p?.questions.length || p.attempt.submitted_at) return;
    await api(`/api/exams/sessions/${id}/answers`, {
      method: "PUT",
      body: JSON.stringify(buildAnswersPayload(p.questions, a)),
    });
  }, [id]);

  useEffect(() => {
    if (submitted || rulesPending || !paper?.questions.length) return;
    const t = window.setTimeout(() => {
      saveDraft().catch(() => {});
    }, 400);
    return () => window.clearTimeout(t);
  }, [answers, submitted, rulesPending, paper?.session_id, saveDraft]);

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
        await api(`/api/exams/sessions/${id}/answers`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        const res = await api<ExamAttempt>(`/api/exams/sessions/${id}/submit`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setAttempt(res);
        setPaper((prev) => (prev ? { ...prev, attempt: { ...prev.attempt, ...res } } : prev));
        setSuccess(force ? he.examAutoSubmitted : he.examSubmitted);
        setAutoSubmitted(force);
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
    paper?.session_id,
    paper?.auto_submit_on_timeout,
    rulesPending,
    submit,
  ]);

  const showTimeWarning =
    paper &&
    attempt?.expires_at &&
    !attempt.submitted_at &&
    !rulesPending &&
    (() => {
      const remainingMin = (new Date(attempt.expires_at).getTime() - Date.now()) / 60000;
      return remainingMin > 0 && remainingMin <= paper.warning_minutes;
    })();

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

      {!submitted && !integrityActive && (
        <Button
          component={RouterLink}
          to={`/student/courses/${paper.offering_id}`}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mb: 2 }}
        >
          {he.backToCourse}
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
        {!submitted && attempt?.started_at && (
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
          {attempt?.score != null && attempt.max_score != null && (
            <Typography variant="body2" sx={{ mt: 1, textAlign: "inherit" }}>
              {he.yourScore}: {attempt.score} / {attempt.max_score}
            </Typography>
          )}
        </Alert>
      )}

      {submitted ? (
        <>
          {review && <ExamSubmissionReview review={review} />}
          <Button component={RouterLink} to="/student/courses" variant="outlined" sx={{ mt: 2 }}>
            {he.backToCourses}
          </Button>
        </>
      ) : rulesPending ? null : (
        <>
          {paper.questions.map((q, i) => (
            <QuestionBlock
              key={q.id}
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
            onClick={() => submit()}
            disabled={submitting}
            sx={{ mt: 2 }}
          >
            {submitting ? he.loading : he.submitExam}
          </Button>
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
  index,
  question,
  selected,
  onSingle,
  onToggle,
}: {
  index: number;
  question: StudentQuestion;
  selected: number[];
  onSingle: (questionId: number, optionId: number) => void;
  onToggle: (questionId: number, optionId: number, checked: boolean) => void;
}) {
  const isMultiple = question.question_type === "multiple";
  const qDir = contentDirForQuestionText(question.text);
  const ltr = qDir === "ltr";
  const pointsLabel = formatExamPointsLabel(question.points, qDir);

  return (
    <Card sx={{ mb: 2 }}>
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
