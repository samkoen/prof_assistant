import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import StopIcon from "@mui/icons-material/Stop";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import ListPageToolbar from "../../components/ListPageToolbar";
import { ExamActionButtons, ExamEditLink } from "../../components/ExamActionButtons";
import {
  api,
  ApiError,
  examMatchesOffering,
  formatScopeSummary,
  offeringLabel,
  semesterLabel,
  type CatalogCourse,
  type CourseOffering,
  type Exam,
  type ExamSession,
} from "../../api/client";
import { he } from "../../i18n/he";

export default function TeacherExamsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activateOpen, setActivateOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activateOfferingId, setActivateOfferingId] = useState("");
  const [activateIntegrity, setActivateIntegrity] = useState(false);
  const [confirmDeactivateSession, setConfirmDeactivateSession] = useState<ExamSession | null>(null);
  const [confirmCloseSession, setConfirmCloseSession] = useState<ExamSession | null>(null);
  const [deactivatingSessionId, setDeactivatingSessionId] = useState<number | null>(null);
  const [closingSessionId, setClosingSessionId] = useState<number | null>(null);
  const [examsRefreshKey, setExamsRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sess, cats, offs] = await Promise.all([
        api<ExamSession[]>("/api/exams/sessions/mine"),
        api<CatalogCourse[]>("/api/catalog-courses/mine"),
        api<CourseOffering[]>("/api/courses/mine"),
      ]);
      setSessions(sess);
      setCatalogs(cats);
      setOfferings(offs);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshExams = () => {
    setExamsRefreshKey((k) => k + 1);
    load();
  };

  const openActivate = (exam: Exam) => {
    setSelectedExam(exam);
    setActivateOfferingId("");
    setActivateIntegrity(false);
    setActivateOpen(true);
  };

  const activate = async () => {
    if (!selectedExam || !activateOfferingId) return;
    try {
      await api(`/api/exams/${selectedExam.id}/activate`, {
        method: "POST",
        body: JSON.stringify({
          offering_id: Number(activateOfferingId),
          integrity_mode_enabled: activateIntegrity,
        }),
      });
      setActivateOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const closeSession = async () => {
    if (!confirmCloseSession) return;
    setClosingSessionId(confirmCloseSession.id);
    try {
      await api(`/api/exams/sessions/${confirmCloseSession.id}/close`, { method: "POST" });
      setConfirmCloseSession(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setClosingSessionId(null);
    }
  };

  const deactivateSession = async () => {
    if (!confirmDeactivateSession) return;
    setDeactivatingSessionId(confirmDeactivateSession.id);
    try {
      await api(`/api/exams/sessions/${confirmDeactivateSession.id}/deactivate`, { method: "POST" });
      setConfirmDeactivateSession(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setDeactivatingSessionId(null);
    }
  };

  const matchingOfferings = selectedExam
    ? offerings.filter(
        (o) =>
          o.catalog_course_id === selectedExam.catalog_course_id && examMatchesOffering(selectedExam, o)
      )
    : [];

  return (
    <Box sx={{ width: "100%" }}>
      <ListPageToolbar
        title={he.exams}
        subtitle={he.catalogCoursesSubtitle}
        addLabel={he.createExam}
        onAdd={() => navigate("/teacher/exams/new")}
      />

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
        <Typography color="text.secondary">{he.noExams}</Typography>
      ) : (
        sessions.map((s) => (
          <Card key={s.id} sx={{ mb: 1 }}>
            <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Box flex={1} minWidth={200}>
                <Typography fontWeight={600}>{s.exam_title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.catalog_name} — {s.group_name} ({s.academic_year}, {semesterLabel(s.semester)}) —{" "}
                  {s.status} — {s.question_count} שאלות
                </Typography>
              </Box>
              {s.status === "active" && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    startIcon={<DoneAllIcon />}
                    disabled={closingSessionId === s.id}
                    onClick={() => setConfirmCloseSession(s)}
                  >
                    {closingSessionId === s.id ? he.loading : he.closeExam}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<StopIcon />}
                    disabled={deactivatingSessionId === s.id}
                    onClick={() => setConfirmDeactivateSession(s)}
                  >
                    {deactivatingSessionId === s.id ? he.loading : he.cancelActivation}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {he.draftExams}
      </Typography>
      <CatalogExamsList
        key={examsRefreshKey}
        catalogs={catalogs}
        onActivate={openActivate}
        onError={setError}
        onChanged={refreshExams}
      />

      <Dialog open={activateOpen} onClose={() => setActivateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{he.activateExam}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            select
            fullWidth
            label={he.myCourses}
            value={activateOfferingId}
            onChange={(e) => setActivateOfferingId(e.target.value)}
          >
            {matchingOfferings.map((o) => (
              <MenuItem key={o.id} value={String(o.id)}>
                {offeringLabel(o)}
              </MenuItem>
            ))}
          </TextField>
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
          <Button onClick={() => setActivateOpen(false)}>{he.cancel}</Button>
          <DisabledActionTooltip
            disabled={!activateOfferingId}
            disabledReason={!activateOfferingId ? he.selectOfferingToActivate : undefined}
          >
            <Button variant="contained" onClick={activate}>
              {he.activateExam}
            </Button>
          </DisabledActionTooltip>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!confirmCloseSession}
        onClose={() => setConfirmCloseSession(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{he.closeExam}</DialogTitle>
        <DialogContent>
          <Typography>{he.closeExamConfirm}</Typography>
          {confirmCloseSession && (
            <Typography fontWeight={600} sx={{ mt: 1 }}>
              {confirmCloseSession.exam_title}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCloseSession(null)}>{he.cancel}</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={closeSession}
            disabled={closingSessionId != null}
          >
            {closingSessionId != null ? he.loading : he.closeExam}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!confirmDeactivateSession}
        onClose={() => setConfirmDeactivateSession(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{he.cancelActivation}</DialogTitle>
        <DialogContent>
          <Typography>{he.cancelActivationConfirm}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeactivateSession(null)}>{he.cancel}</Button>
          <Button variant="contained" color="warning" onClick={deactivateSession}>
            {he.cancelActivation}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function CatalogExamsList({
  catalogs,
  onActivate,
  onError,
  onChanged,
}: {
  catalogs: CatalogCourse[];
  onActivate: (exam: Exam) => void;
  onError: (message: string) => void;
  onChanged: () => void;
}) {
  const [examsByCatalog, setExamsByCatalog] = useState<Record<number, Exam[]>>({});

  useEffect(() => {
    (async () => {
      const map: Record<number, Exam[]> = {};
      for (const c of catalogs) {
        map[c.id] = await api<Exam[]>(`/api/exams/catalog/${c.id}`);
      }
      setExamsByCatalog(map);
    })().catch(() => onError(he.errorGeneric));
  }, [catalogs, onError]);

  const allExams = catalogs.flatMap((c) =>
    (examsByCatalog[c.id] ?? []).map((ex) => ({ exam: ex, catalogName: c.name }))
  );

  if (allExams.length === 0) {
    return <Typography color="text.secondary">{he.noExams}</Typography>;
  }

  return allExams.map(({ exam, catalogName }) => (
    <Card key={exam.id} sx={{ mb: 1 }}>
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Box flex={1} minWidth={200}>
          <Typography fontWeight={600}>{exam.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {catalogName} — {exam.question_count} שאלות · {formatScopeSummary(exam)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0, flexWrap: "wrap" }}>
          <ExamEditLink examId={exam.id} viewOnly={exam.can_delete === false} />
          <ExamActionButtons exam={exam} onChanged={onChanged} onError={onError} />
          <Button size="small" variant="contained" onClick={() => onActivate(exam)}>
            {he.activateExam}
          </Button>
        </Box>
      </CardContent>
    </Card>
  ));
}
