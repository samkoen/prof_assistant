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
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GradingIcon from "@mui/icons-material/Grading";
import AddIcon from "@mui/icons-material/Add";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { ExamActionButtons, ExamEditLink } from "../../components/ExamActionButtons";
import AddExistingExamDialog from "../../components/AddExistingExamDialog";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
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

/** Statut affiché prof : actif / fermé / sinon tout regroupé sous « לא פעיל ». */
function examDisplayStatus(session: ExamSession | undefined) {
  if (session?.status === "active") {
    return { color: "success" as const, label: he.examAlreadyActive };
  }
  if (session?.status === "closed") {
    return { color: "default" as const, label: he.examClosed };
  }
  return { color: "warning" as const, label: he.examNotActive };
}

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
  const [closeSession, setCloseSession] = useState<ExamSession | null>(null);
  const [closingSessionId, setClosingSessionId] = useState<number | null>(null);
  const [activateExam, setActivateExam] = useState<Exam | null>(null);
  const [activateIntegrity, setActivateIntegrity] = useState(false);
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

  const confirmStartExam = async () => {
    if (!offering || !activateExam) return;
    setActivatingId(activateExam.id);
    setError("");
    setSuccess("");
    try {
      await api(`/api/exams/${activateExam.id}/activate`, {
        method: "POST",
        body: JSON.stringify({
          offering_id: offering.id,
          integrity_mode_enabled: activateIntegrity,
        }),
      });
      setSuccess(`${he.examActivated}: ${activateExam.title}`);
      setActivateExam(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setActivatingId(null);
    }
  };

  const closeExamSession = async () => {
    if (!closeSession) return;
    setClosingSessionId(closeSession.id);
    setError("");
    setSuccess("");
    try {
      await api(`/api/exams/sessions/${closeSession.id}/close`, { method: "POST" });
      setSuccess(`${he.examClosedSuccess}: ${closeSession.exam_title}`);
      setCloseSession(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setClosingSessionId(null);
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
          const canStart = !session || session.status === "draft";
          const hasQuestions = exam.question_count > 0;
          const statusChip = examDisplayStatus(session);

          return (
            <Card key={exam.id} sx={{ mb: 2 }}>
              <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Box flex={1} minWidth={220}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                    <Typography fontWeight={600}>{exam.title}</Typography>
                    <Chip size="small" color={statusChip.color} label={statusChip.label} />
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
                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, alignItems: "center" }}>
                  <ExamEditLink
                    examId={exam.id}
                    returnTo={`/teacher/courses/${id}/exams`}
                    iconOnly
                  />
                  <ExamActionButtons
                    exam={exam}
                    onChanged={load}
                    onError={setError}
                    iconOnly
                  />
                  {session && session.status !== "draft" && (
                    <Tooltip title={he.viewExamGrades}>
                      <IconButton
                        component={RouterLink}
                        to={`/teacher/courses/${id}/exams/sessions/${session.id}/results`}
                        size="small"
                        color="primary"
                        aria-label={he.viewExamGrades}
                      >
                        <GradingIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canStart && (
                    <DisabledActionTooltip
                      disabled={!hasQuestions || activatingId === exam.id}
                      disabledReason={!hasQuestions ? he.noQuestionsYet : undefined}
                    >
                      <IconButton
                        size="small"
                        color="success"
                        aria-label={he.startExamNow}
                        onClick={() => {
                          setActivateIntegrity(false);
                          setActivateExam(exam);
                        }}
                      >
                        {activatingId === exam.id ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <PlayArrowIcon fontSize="small" />
                        )}
                      </IconButton>
                    </DisabledActionTooltip>
                  )}
                  {isActive && session && (
                    <>
                      <Tooltip
                        title={closingSessionId === session.id ? he.loading : he.closeExam}
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label={he.closeExam}
                            disabled={closingSessionId === session.id}
                            onClick={() => setCloseSession(session)}
                          >
                            {closingSessionId === session.id ? (
                              <CircularProgress size={18} />
                            ) : (
                              <DoneAllIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip
                        title={
                          deactivatingSessionId === session.id
                            ? he.loading
                            : he.cancelActivation
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="warning"
                            aria-label={he.cancelActivation}
                            disabled={deactivatingSessionId === session.id}
                            onClick={() => setConfirmSession(session)}
                          >
                            {deactivatingSessionId === session.id ? (
                              <CircularProgress size={18} />
                            ) : (
                              <StopIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </>
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

      <Dialog open={!!activateExam} onClose={() => setActivateExam(null)} fullWidth maxWidth="sm">
        <DialogTitle>{he.activateExam}</DialogTitle>
        <DialogContent>
          {activateExam && (
            <Typography fontWeight={600} gutterBottom>
              {activateExam.title}
            </Typography>
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={activateIntegrity}
                onChange={(e) => setActivateIntegrity(e.target.checked)}
              />
            }
            label={he.integrityMode}
          />
          <Typography variant="caption" color="text.secondary" display="block">
            {he.integrityModeHint}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateExam(null)}>{he.cancel}</Button>
          <Button
            variant="contained"
            color="success"
            onClick={confirmStartExam}
            disabled={activatingId != null}
          >
            {activatingId != null ? he.loading : he.startExamNow}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!closeSession} onClose={() => setCloseSession(null)} fullWidth maxWidth="xs">
        <DialogTitle>{he.closeExam}</DialogTitle>
        <DialogContent>
          <Typography>{he.closeExamConfirm}</Typography>
          {closeSession && (
            <Typography fontWeight={600} sx={{ mt: 1 }}>
              {closeSession.exam_title}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseSession(null)}>{he.cancel}</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={closeExamSession}
            disabled={closingSessionId != null}
          >
            {closingSessionId != null ? he.loading : he.closeExam}
          </Button>
        </DialogActions>
      </Dialog>

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
