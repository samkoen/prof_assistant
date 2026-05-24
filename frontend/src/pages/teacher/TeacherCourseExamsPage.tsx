import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import GradingIcon from "@mui/icons-material/Grading";
import AddIcon from "@mui/icons-material/Add";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { ExamActionButtons, ExamEditLink } from "../../components/ExamActionButtons";
import AddExistingExamDialog from "../../components/AddExistingExamDialog";
import {
  api,
  ApiError,
  formatScopeSummary,
  offeringLabel,
  type CourseOffering,
  type Exam,
  type ExamSession,
} from "../../api/client";
import { he } from "../../i18n/he";

const statusLabel: Record<ExamSession["status"], string> = {
  active: "פעיל",
  draft: "טיוטה",
  closed: "סגור",
};

const statusColor: Record<ExamSession["status"], "success" | "default" | "warning"> = {
  active: "success",
  draft: "warning",
  closed: "default",
};

export default function TeacherCourseExamsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = Number(courseId);
  const navigate = useNavigate();
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [deactivatingSessionId, setDeactivatingSessionId] = useState<number | null>(null);
  const [confirmSession, setConfirmSession] = useState<ExamSession | null>(null);
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const offerings = await api<CourseOffering[]>("/api/courses/mine");
      const found = offerings.find((o) => o.id === id) ?? null;
      setOffering(found);
      if (!found) {
        setError("קורס לא נמצא");
        return;
      }
      const [examList, sessionList] = await Promise.all([
        api<Exam[]>(`/api/exams/catalog/${found.catalog_course_id}?offering_id=${found.id}`),
        api<ExamSession[]>(`/api/exams/sessions/offering/${found.id}`),
      ]);
      setExams(examList);
      setSessions(sessionList);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const sessionByExamId = useMemo(() => {
    const map = new Map<number, ExamSession>();
    for (const s of sessions) {
      map.set(s.exam_id, s);
    }
    return map;
  }, [sessions]);

  const startExam = async (exam: Exam) => {
    if (!offering) return;
    setActivatingId(exam.id);
    setError("");
    setSuccess("");
    try {
      await api(`/api/exams/${exam.id}/activate`, {
        method: "POST",
        body: JSON.stringify({ offering_id: offering.id }),
      });
      setSuccess(`${he.examActivated}: ${exam.title}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setActivatingId(null);
    }
  };

  const deactivateExam = async () => {
    if (!confirmSession) return;
    setDeactivatingSessionId(confirmSession.id);
    setError("");
    setSuccess("");
    try {
      await api(`/api/exams/sessions/${confirmSession.id}/deactivate`, { method: "POST" });
      setSuccess(`${he.examDeactivated}: ${confirmSession.exam_title}`);
      setConfirmSession(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setDeactivatingSessionId(null);
    }
  };

  if (loading && !offering) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 840 }}>
      <Button
        component={RouterLink}
        to="/teacher/courses"
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ mb: 2 }}
      >
        {he.backToCourses}
      </Button>

      <Typography variant="h5" fontWeight={700} gutterBottom>
        {he.manageCourseExams}
      </Typography>
      {offering && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {offeringLabel(offering)}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            sx={{ mb: 1, mr: 1 }}
            onClick={() =>
              navigate(
                `/teacher/exams/new?catalog_course_id=${offering.catalog_course_id}&offering_id=${offering.id}&return=${encodeURIComponent(`/teacher/courses/${id}/exams`)}`
              )
            }
          >
            {he.createExam}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PlaylistAddIcon />}
            size="small"
            sx={{ mb: 2 }}
            onClick={() => setAddExistingOpen(true)}
          >
            {he.addExistingExam}
          </Button>
        </>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {exams.length === 0 ? (
        <Typography color="text.secondary">{he.noExams}</Typography>
      ) : (
        exams.map((exam) => {
          const session = sessionByExamId.get(exam.id);
          const isActive = session?.status === "active";
          const isClosed = session?.status === "closed";
          const canStart = !session || session.status === "draft";
          const hasQuestions = exam.question_count > 0;

          return (
            <Card key={exam.id} sx={{ mb: 2 }}>
              <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Box flex={1} minWidth={220}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                    <Typography fontWeight={600}>{exam.title}</Typography>
                    {session && (
                      <Chip
                        size="small"
                        color={statusColor[session.status]}
                        label={
                          isActive
                            ? he.examAlreadyActive
                            : isClosed
                              ? he.examClosed
                              : statusLabel[session.status]
                        }
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {exam.question_count} {he.questionsInExam} · {formatScopeSummary(exam)}
                  </Typography>
                  {!hasQuestions && (
                    <Typography variant="caption" color="warning.main">
                      {he.noQuestionsYet}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0, flexWrap: "wrap" }}>
                  <ExamEditLink examId={exam.id} returnTo={`/teacher/courses/${id}/exams`} />
                  <ExamActionButtons exam={exam} onChanged={load} onError={setError} />
                  {session && session.status !== "draft" && (
                    <Button
                      size="small"
                      variant="outlined"
                      component={RouterLink}
                      to={`/teacher/courses/${id}/exams/sessions/${session.id}/results`}
                      startIcon={<GradingIcon />}
                    >
                      {he.viewExamGrades}
                    </Button>
                  )}
                  {canStart && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<PlayArrowIcon />}
                      disabled={!hasQuestions || activatingId === exam.id}
                      onClick={() => startExam(exam)}
                    >
                      {activatingId === exam.id ? he.loading : he.startExamNow}
                    </Button>
                  )}
                  {isActive && session && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<StopIcon />}
                      disabled={deactivatingSessionId === session.id}
                      onClick={() => setConfirmSession(session)}
                    >
                      {deactivatingSessionId === session.id ? he.loading : he.cancelActivation}
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })
      )}

      {offering && (
        <AddExistingExamDialog
          open={addExistingOpen}
          offering={offering}
          visibleExamIds={exams.map((e) => e.id)}
          onClose={() => setAddExistingOpen(false)}
          onAttached={async () => {
            setSuccess(he.examAddedToGroup);
            await load();
          }}
        />
      )}

      <Dialog open={!!confirmSession} onClose={() => setConfirmSession(null)} fullWidth maxWidth="xs">
        <DialogTitle>{he.cancelActivation}</DialogTitle>
        <DialogContent>
          <Typography>{he.cancelActivationConfirm}</Typography>
          {confirmSession && (
            <Typography fontWeight={600} sx={{ mt: 1 }}>
              {confirmSession.exam_title}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSession(null)}>{he.cancel}</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={deactivateExam}
            disabled={deactivatingSessionId != null}
          >
            {deactivatingSessionId != null ? he.loading : he.cancelActivation}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
