import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  api,
  ApiError,
  offeringLabel,
  type ExamAttempt,
  type CourseOffering,
  type ExamSession,
} from "../../api/client";
import { he } from "../../i18n/he";

type SessionWithAttempt = ExamSession & { attempt: ExamAttempt | null };

export default function StudentCourseExamsPage() {
  const { offeringId } = useParams<{ offeringId: string }>();
  const id = Number(offeringId);
  const navigate = useNavigate();
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [sessions, setSessions] = useState<SessionWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const active = list.filter((s) => s.status === "active");
      const withAttempts = await Promise.all(
        active.map(async (s) => {
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
    <Box sx={{ width: "100%", maxWidth: 720 }}>
      <Button
        component={RouterLink}
        to="/student/courses"
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ mb: 2 }}
      >
        {he.backToCourses}
      </Button>

      <Typography variant="h5" fontWeight={700} gutterBottom>
        {he.courseExams}
      </Typography>
      {offering && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {offeringLabel(offering)}
        </Typography>
      )}

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

      {sessions.map((s) => {
        const submitted = !!s.attempt?.submitted_at;
        const inProgress = !!s.attempt?.started_at && !submitted;

        return (
          <Card
            key={s.id}
            sx={{
              mb: 2,
              border: "2px solid",
              borderColor: submitted ? "grey.300" : "success.light",
              bgcolor: submitted ? "grey.50" : "rgba(76, 175, 80, 0.08)",
            }}
          >
            <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Box flex={1} minWidth={200}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                  <Typography variant="h6" fontWeight={700}>
                    {s.exam_title}
                  </Typography>
                  <Chip
                    size="small"
                    color={submitted ? "default" : "success"}
                    label={submitted ? he.alreadySubmitted : he.examInProgress}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {s.question_count} {he.questionsInExam}
                  {submitted && s.attempt?.score != null && s.attempt.max_score != null && (
                    <> · {he.yourScore}: {s.attempt.score} / {s.attempt.max_score}</>
                  )}
                  {inProgress && <> · {he.continueExam}</>}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color={submitted ? "inherit" : "success"}
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={() => startExam(s.id)}
              >
                {actionLabel(s.attempt)}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
