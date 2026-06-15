import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  api,
  ApiError,
  offeringLabel,
  type ExamAttempt,
  type CourseOffering,
  type ExamSession,
} from "../../api/client";
import ListPageToolbar from "../../components/ListPageToolbar";
import StudentGeminiConfigCard from "../../components/StudentGeminiConfigCard";
import HebrewCardRow from "../../components/ui/HebrewCardRow";
import HebrewCountPhrase from "../../components/ui/HebrewCountPhrase";
import { he } from "../../i18n/he";
import { examListRowDetailsSx, examListRowTitleSx } from "../../styles/hebrewAlign";
import { studentExamChipProps } from "../../utils/studentExamSessionDisplay";
import { canStudentAccessExam } from "../../utils/studentExamAccess";
import {
  examSessionRowId,
  parseFocusSessionId,
} from "../../utils/studentCourseExamsNav";

type SessionWithAttempt = ExamSession & { attempt: ExamAttempt | null };

export default function StudentCourseExamsPage() {
  const { offeringId } = useParams<{ offeringId: string }>();
  const id = Number(offeringId);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [sessions, setSessions] = useState<SessionWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highlightSessionId, setHighlightSessionId] = useState<number | null>(null);
  const focusSessionId = parseFocusSessionId(searchParams.get("focusSession"));

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const mine = await api<CourseOffering[]>("/api/courses/mine");
      const found = mine.find((o) => o.id === id) ?? null;
      setOffering(found);
      if (!found) {
        setError("קורס לא נמצא");
        return;
      }
      if (found.enrollment_status === "pending") {
        setSessions([]);
        return;
      }
      const list = await api<ExamSession[]>(`/api/exams/sessions/offering/${id}`);
      const withAttempts = await Promise.all(
        list.map(async (s) => {
          const attempt = await api<ExamAttempt | null>(`/api/exams/sessions/${s.id}/my-attempt`);
          return { ...s, attempt };
        })
      );
      setSessions(withAttempts);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!focusSessionId || loading) return;
    if (!sessions.some((s) => s.id === focusSessionId)) return;

    const scrollToRow = () => {
      document.getElementById(examSessionRowId(focusSessionId))?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    };

    const scrollTimer = window.setTimeout(scrollToRow, 80);
    setHighlightSessionId(focusSessionId);

    const next = new URLSearchParams(searchParams);
    next.delete("focusSession");
    setSearchParams(next, { replace: true });

    const clearTimer = window.setTimeout(() => setHighlightSessionId(null), 3000);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [focusSessionId, loading, sessions, searchParams, setSearchParams]);

  const startExam = (sessionId: number) => {
    navigate(`/student/exams/${sessionId}`);
  };

  const actionLabel = (attempt: ExamAttempt | null) => {
    if (attempt?.submitted_at) return he.viewExamResult;
    if (attempt?.started_at) return he.continueExam;
    return he.startExam;
  };

  if (loading && !offering) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <ListPageToolbar
        title={he.courseExams}
        subtitle={offering ? offeringLabel(offering) : undefined}
        titleVariant="h5"
        actions={
          <Button
            component={RouterLink}
            to="/student/courses"
            startIcon={<ArrowBackIcon />}
            size="small"
          >
            {he.backToCourses}
          </Button>
        }
      />
      <StudentGeminiConfigCard />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {offering?.enrollment_status === "pending" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {he.enrollmentPendingHint}
        </Alert>
      )}

      {sessions.length === 0 && !error && offering?.enrollment_status !== "pending" && (
        <Alert severity="info">{he.noActiveExamsHint}</Alert>
      )}

      {sessions.length > 0 && !sessions.some((s) => s.status === "active") && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {he.noActiveExamsHint}
        </Alert>
      )}

      {sessions.map((s) => {
        const submitted = !!s.attempt?.submitted_at;
        const inProgress = !!s.attempt?.started_at && !submitted;
        const canAccess = canStudentAccessExam(s, s.attempt);
        const chip = studentExamChipProps(s, s.attempt);
        const focused = highlightSessionId === s.id;

        return (
          <HebrewCardRow
            key={s.id}
            id={examSessionRowId(s.id)}
            examList
            text={
              <>
                <Box sx={examListRowDetailsSx}>
                  <Typography variant="body2" color="text.secondary" component="span">
                    <HebrewCountPhrase label={he.questionsInExam} count={s.question_count} />
                    {submitted && s.attempt?.score != null && s.attempt.max_score != null && (
                      <> · {he.yourScore}: {s.attempt.score} / {s.attempt.max_score}</>
                    )}
                    {inProgress && <> · {he.continueExam}</>}
                  </Typography>
                </Box>
                <Chip size="small" color={chip.color} label={chip.label} />
                <Typography variant="h6" fontWeight={700} sx={examListRowTitleSx}>
                  {s.exam_title}
                </Typography>
              </>
            }
            actions={
              <Tooltip title={canAccess ? actionLabel(s.attempt) : he.examClosed}>
                <span>
                  <IconButton
                    size="small"
                    color={submitted ? "primary" : "success"}
                    onClick={() => startExam(s.id)}
                    disabled={!canAccess}
                    aria-label={actionLabel(s.attempt)}
                  >
                    {submitted ? <VisibilityOutlinedIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            }
            sx={{
              mb: 2,
              border: "2px solid",
              borderColor: focused ? "warning.main" : submitted ? "grey.300" : "success.light",
              bgcolor: focused
                ? "rgba(255, 193, 7, 0.12)"
                : submitted
                  ? "grey.50"
                  : "rgba(76, 175, 80, 0.08)",
              boxShadow: focused ? (theme) => `0 0 0 1px ${theme.palette.warning.main}` : undefined,
              transition: "border-color 0.3s, background-color 0.3s, box-shadow 0.3s",
            }}
          />
        );
      })}
    </Box>
  );
}
