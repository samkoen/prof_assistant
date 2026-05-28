import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ListPageToolbar from "../../components/ListPageToolbar";
import StudentGeminiConfigCard from "../../components/StudentGeminiConfigCard";
import HebrewCardRow from "../../components/ui/HebrewCardRow";
import { api, ApiError, semesterLabel, type ExamAttempt, type ExamSession } from "../../api/client";
import { he } from "../../i18n/he";
import { examListRowDetailsSx, examListRowTitleSx } from "../../styles/hebrewAlign";
import { studentExamChipProps } from "../../utils/studentExamSessionDisplay";

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
      <StudentGeminiConfigCard />
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
        <>
          {!sessions.some((s) => s.status === "active") && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {he.noActiveExamsHint}
            </Alert>
          )}
          {sessions.map((s) => {
          const submitted = !!s.attempt?.submitted_at;
          const inProgress = !!s.attempt?.started_at && !submitted;
          const chip = studentExamChipProps(s, s.attempt);
          return (
            <HebrewCardRow
              key={s.id}
              examList
              text={
                <>
                  <Box sx={examListRowDetailsSx}>
                    <Typography variant="body2" color="text.secondary">
                      {s.catalog_name} — {s.group_name} ({s.academic_year}, {semesterLabel(s.semester)}) ·{" "}
                      {s.question_count} {he.questionsInExam}
                      {submitted && s.attempt?.score != null && s.attempt.max_score != null && (
                        <> · {he.yourScore}: {s.attempt.score} / {s.attempt.max_score}</>
                      )}
                      {inProgress && <> · {he.continueExam}</>}
                    </Typography>
                  </Box>
                  <Chip size="small" color={chip.color} label={chip.label} />
                  <Typography variant="h6" fontWeight={600} sx={examListRowTitleSx}>
                    {s.exam_title}
                  </Typography>
                </>
              }
              actions={
                <Tooltip title={actionLabel(s.attempt)}>
                  <IconButton
                    size="small"
                    color={submitted ? "primary" : "success"}
                    onClick={() => navigate(`/student/exams/${s.id}`)}
                    aria-label={actionLabel(s.attempt)}
                  >
                    {submitted ? <VisibilityOutlinedIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              }
              sx={{
                mb: 2,
                border: submitted ? undefined : "2px solid",
                borderColor: "success.light",
              }}
            />
          );
        })}
        </>
      )}
    </Box>
  );
}
