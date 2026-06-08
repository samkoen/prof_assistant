import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import AddExistingExamDialog from "../../components/AddExistingExamDialog";
import ExamActivateTimingFields from "../../components/ExamActivateTimingFields";
import DataListTable from "../../components/DataListTable/DataListTable";
import ExamsStatusTabs, { type ExamsStatusTab } from "../../components/ExamsStatusTabs";
import ExamOfferingRowActions from "../../components/ExamOfferingRowActions";
import ListPageToolbar from "../../components/ListPageToolbar";
import { getCourseExamTableColumns } from "../../config/courseExamTableColumns";
import {
  api,
  ApiError,
  offeringLabel,
  type CourseOffering,
  type Exam,
  type ExamSession,
} from "../../api/client";
import { he } from "../../i18n/he";
import {
  timingActivatePayload,
  timingFromExam,
  validateExamTiming,
  type ExamTimingForm,
} from "../../utils/examActivateTiming";

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
  const [activateTiming, setActivateTiming] = useState<ExamTimingForm>({
    durationMinutes: "45",
    warningMinutes: "10",
    autoSubmitOnTimeout: true,
  });
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [examsTab, setExamsTab] = useState<ExamsStatusTab>("open");

  const columns = useMemo(() => getCourseExamTableColumns(), []);

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

  const tableRows = useMemo(
    () => exams.map((exam) => ({ exam, session: sessionByExamId.get(exam.id) })),
    [exams, sessionByExamId],
  );

  const openRows = useMemo(
    () => tableRows.filter((row) => row.session?.status !== "closed"),
    [tableRows],
  );
  const closedRows = useMemo(
    () => tableRows.filter((row) => row.session?.status === "closed"),
    [tableRows],
  );
  const visibleRows = examsTab === "closed" ? closedRows : openRows;

  const confirmStartExam = async () => {
    if (!offering || !activateExam) return;
    const timingError = validateExamTiming(activateTiming);
    if (timingError) {
      setError(timingError);
      return;
    }
    setActivatingId(activateExam.id);
    setError("");
    setSuccess("");
    try {
      await api(`/api/exams/${activateExam.id}/activate`, {
        method: "POST",
        body: JSON.stringify({
          offering_id: offering.id,
          integrity_mode_enabled: activateIntegrity,
          ...timingActivatePayload(activateTiming),
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
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }} dir="rtl">
      <Button
        component={RouterLink}
        to="/teacher/courses"
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ mb: 2 }}
      >
        {he.backToCourses}
      </Button>

      <ListPageToolbar
        titleVariant="h5"
        title={
          <>
            {he.manageCourseExams}
            {offering && (
              <Box
                component="span"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  fontSize: "1.125rem",
                  whiteSpace: "nowrap",
                }}
              >
                {" · "}
                {offeringLabel(offering)}
              </Box>
            )}
          </>
        }
        actions={
          offering ? (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
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
                onClick={() => setAddExistingOpen(true)}
              >
                {he.addExistingExam}
              </Button>
            </>
          ) : undefined
        }
      />

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

      <ExamsStatusTabs
        value={examsTab}
        onChange={setExamsTab}
        openCount={openRows.length}
        closedCount={closedRows.length}
      />

      <DataListTable
        viewKey={`teacher-course-exams-${id}-${examsTab}`}
        rows={visibleRows}
        columns={columns}
        loading={loading}
        emptyMessage={examsTab === "closed" ? he.noClosedExams : he.noExams}
        getRowId={(row) => row.exam.id}
        actionsColumnPx={210}
        renderActions={(row) => (
          <ExamOfferingRowActions
            exam={row.exam}
            session={row.session}
            courseId={id}
            hasQuestions={row.exam.question_count > 0}
            activatingId={activatingId}
            closingSessionId={closingSessionId}
            deactivatingSessionId={deactivatingSessionId}
            returnTo={`/teacher/courses/${id}/exams`}
            onChanged={load}
            onError={setError}
            onStartClick={(exam) => {
              setActivateIntegrity(false);
              setActivateTiming(timingFromExam(exam));
              setActivateExam(exam);
            }}
            onCloseClick={setCloseSession}
            onDeactivateClick={setConfirmSession}
          />
        )}
      />

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
          <ExamActivateTimingFields value={activateTiming} onChange={setActivateTiming} />
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
