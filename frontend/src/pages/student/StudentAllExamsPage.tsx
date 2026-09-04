import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import ListPageToolbar from "../../components/ListPageToolbar";
import StudentExamRowIcon from "../../components/StudentExamRowIcon";
import StudentGeminiConfigCard from "../../components/StudentGeminiConfigCard";
import HebrewCardRow from "../../components/ui/HebrewCardRow";
import HebrewCountPhrase from "../../components/ui/HebrewCountPhrase";
import { api, ApiError, semesterLabel, type ExamAttempt, type StudentExamSessionWithAttempt } from "../../api/client";
import { he } from "../../i18n/he";
import { examListRowDetailsSx, examListRowTitleSx } from "../../styles/hebrewAlign";
import { studentExamChipProps } from "../../utils/studentExamSessionDisplay";
import { canStudentAccessExam } from "../../utils/studentExamAccess";

type SessionWithAttempt = StudentExamSessionWithAttempt;

export default function StudentAllExamsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSessions(
        await api<StudentExamSessionWithAttempt[]>("/api/exams/sessions/mine/student-board"),
      );
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
          const canAccess = canStudentAccessExam(s, s.attempt);
          const chip = studentExamChipProps(s, s.attempt);
          return (
            <Tooltip key={s.id} title={canAccess ? actionLabel(s.attempt) : he.examClosed}>
              <Box component="span" sx={{ display: "block" }}>
                <HebrewCardRow
                examList
                onClick={() => navigate(`/student/exams/${s.id}`)}
                disabled={!canAccess}
                ariaLabel={actionLabel(s.attempt)}
                text={
                  <>
                    <Box sx={examListRowDetailsSx}>
                      <Typography variant="body2" color="text.secondary" component="span">
                        {s.catalog_name} — {s.group_name} ({s.academic_year}, {semesterLabel(s.semester)}) ·{" "}
                        <HebrewCountPhrase label={he.questionsInExam} count={s.question_count} />
                        {submitted && (s.is_tirgoul || s.results_published) && s.attempt?.score != null && s.attempt.max_score != null && (
                          <> · {he.yourScore}: {s.attempt.score} / {s.attempt.max_score}</>
                        )}
                        {submitted && !s.is_tirgoul && !s.results_published && <> · {he.examSubmitted}</>}
                        {inProgress && <> · {he.continueExam}</>}
                      </Typography>
                    </Box>
                    <Chip size="small" color={chip.color} label={chip.label} />
                    <Typography variant="h6" fontWeight={600} sx={examListRowTitleSx}>
                      {s.exam_title}
                      {s.is_tirgoul ? ` · ${he.tirgoulChip}` : ""}
                    </Typography>
                  </>
                }
                actions={<StudentExamRowIcon submitted={submitted} canAccess={canAccess} />}
                sx={{
                  mb: 2,
                  border: submitted ? undefined : "2px solid",
                  borderColor: "success.light",
                }}
              />
              </Box>
            </Tooltip>
          );
        })}
        </>
      )}
    </Box>
  );
}
