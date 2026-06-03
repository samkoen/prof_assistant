import { useCallback, useEffect, useMemo, useState } from "react";
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
import MathText from "../../components/MathText";
import QuestionImageDisplay from "../../components/QuestionImageDisplay";
import { examQuestionLtrSx } from "../../components/examQuestionLtrStyles";
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
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
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
  contentDirForExam,
  formatExamPointsLabel,
} from "../../utils/examQuestionsLanguage";

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
        setSuccess(he.examSubmitted);
        await loadReview();
      } else {
        setReview(null);
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

  const allAnswered = useMemo(() => {
    if (!paper) return false;
    return paper.questions.every((q) => (answers[q.id]?.length ?? 0) > 0);
  }, [paper, answers]);

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

  const submit = async (force = false) => {
    if (!paper || (!force && !allAnswered)) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api<ExamAttempt>(`/api/exams/sessions/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers: paper.questions.map((q) => ({
            question_id: q.id,
            selected_option_ids: answers[q.id] ?? [],
          })),
        }),
      });
      setAttempt(res);
      setSuccess(he.examSubmitted);
      await loadReview();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!paper || !attempt?.expires_at || attempt.submitted_at || submitting || rulesPending) {
      return;
    }
    const ms = new Date(attempt.expires_at).getTime() - Date.now();
    if (ms <= 0) {
      submit(true);
      return;
    }
    const t = window.setTimeout(() => submit(true), ms);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt?.expires_at, attempt?.submitted_at, submitting, paper?.session_id, rulesPending]);

  const showTimeWarning =
    paper &&
    attempt?.expires_at &&
    !attempt.submitted_at &&
    !rulesPending &&
    (() => {
      const remainingMin = (new Date(attempt.expires_at).getTime() - Date.now()) / 60000;
      return remainingMin > 0 && remainingMin <= paper.warning_minutes;
    })();

  const contentDir = contentDirForExam(paper?.questions ?? [], paper?.questions_language);

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
              contentDir={contentDir}
              onSingle={setSingle}
              onToggle={toggleMultiple}
            />
          ))}
          <DisabledActionTooltip
            disabled={!allAnswered || submitting}
            disabledReason={!allAnswered ? he.answerAllQuestions : undefined}
          >
            <Button variant="contained" size="large" onClick={() => submit()} sx={{ mt: 2 }}>
              {submitting ? he.loading : he.submitExam}
            </Button>
          </DisabledActionTooltip>
          {!allAnswered && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {he.answerAllQuestions}
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
  contentDir,
  onSingle,
  onToggle,
}: {
  index: number;
  question: StudentQuestion;
  selected: number[];
  contentDir: "ltr" | "rtl";
  onSingle: (questionId: number, optionId: number) => void;
  onToggle: (questionId: number, optionId: number, checked: boolean) => void;
}) {
  const isMultiple = question.question_type === "multiple";
  const ltr = contentDir === "ltr";
  const pointsLabel = formatExamPointsLabel(question.points, contentDir);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent dir={contentDir} sx={ltr ? examQuestionLtrSx : undefined}>
        <Typography
          fontWeight={600}
          gutterBottom
          sx={{
            whiteSpace: "pre-wrap",
            ...(ltr ? { textAlign: "left", direction: "ltr" } : {}),
          }}
        >
          {index}. <MathText text={question.text} component="span" />{" "}
          <Typography component="span" variant="body2" color="text.secondary">
            ({pointsLabel})
          </Typography>
        </Typography>
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
                  ...(ltr ? { textAlign: "left" } : {}),
                }}
              >
                <Box sx={{ direction: "ltr", display: "inline-flex" }}>
                  <Checkbox
                    checked={selected.includes(o.id)}
                    onChange={(e) => onToggle(question.id, o.id, e.target.checked)}
                    sx={{ p: 0.5 }}
                  />
                </Box>
                <OptionText text={o.text} imageUrl={o.image_url} dir={contentDir} />
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
                  ...(ltr ? { textAlign: "left" } : {}),
                }}
              >
                <Box sx={{ direction: "ltr", display: "inline-flex" }}>
                  <Radio
                    checked={selected[0] === o.id}
                    onChange={() => onSingle(question.id, o.id)}
                    sx={{ p: 0.5 }}
                  />
                </Box>
                <OptionText text={o.text} imageUrl={o.image_url} dir={contentDir} />
              </Box>
            ))}
          </FormControl>
        )}
      </CardContent>
    </Card>
  );
}
