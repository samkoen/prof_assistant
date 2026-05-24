import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ListPageToolbar from "../../components/ListPageToolbar";
import { api, ApiError, semesterLabel, type ExamAttempt, type ExamSession } from "../../api/client";
import { he } from "../../i18n/he";

type SessionWithAttempt = ExamSession & { attempt: ExamAttempt | null };

export default function StudentAllExamsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api<ExamSession[]>("/api/exams/sessions/mine");
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
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, [load]);

  const actionLabel = (attempt: ExamAttempt | null) => {
    if (attempt?.submitted_at) return he.viewExamResult;
    if (attempt?.started_at) return he.continueExam;
    return he.startExam;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <ListPageToolbar title={he.exams} subtitle={he.activeExams} />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : sessions.length === 0 ? (
        <Alert severity="info">{he.noActiveExamsHint}</Alert>
      ) : (
        sessions.map((s) => {
          const submitted = !!s.attempt?.submitted_at;
          return (
            <Card
              key={s.id}
              sx={{
                mb: 2,
                border: submitted ? undefined : "2px solid",
                borderColor: "success.light",
              }}
            >
              <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Box flex={1} minWidth={200}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                    <Typography variant="h6" fontWeight={600}>
                      {s.exam_title}
                    </Typography>
                    <Chip
                      size="small"
                      color={submitted ? "default" : "success"}
                      label={submitted ? he.alreadySubmitted : he.examInProgress}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {s.catalog_name} — {s.group_name} ({s.academic_year}, {semesterLabel(s.semester)}) ·{" "}
                    {s.question_count} {he.questionsInExam}
                    {submitted && s.attempt?.score != null && s.attempt.max_score != null && (
                      <> · {he.yourScore}: {s.attempt.score} / {s.attempt.max_score}</>
                    )}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color={submitted ? "inherit" : "success"}
                  startIcon={<PlayArrowIcon />}
                  onClick={() => navigate(`/student/exams/${s.id}`)}
                >
                  {actionLabel(s.attempt)}
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}
    </Box>
  );
}
