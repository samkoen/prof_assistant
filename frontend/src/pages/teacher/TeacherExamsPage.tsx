import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
import GradingIcon from "@mui/icons-material/Grading";
import ExamsStatusTabs, { type ExamsStatusTab } from "../../components/ExamsStatusTabs";
import ExamActivateTimingFields from "../../components/ExamActivateTimingFields";
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
import {
  timingActivatePayload,
  timingFromExam,
  validateExamTiming,
  type ExamTimingForm,
} from "../../utils/examActivateTiming";

function splitSessions(sessions: ExamSession[]) {
  const open = sessions.filter((s) => s.status !== "closed");
  const closed = sessions.filter((s) => s.status === "closed");
  return { open, closed };
}

function sessionStatusLabel(status: ExamSession["status"]): string {
  if (status === "active") return he.examAlreadyActive;
  if (status === "closed") return he.examClosed;
  return he.examDraftStatus;
}

export default function TeacherExamsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examsTab, setExamsTab] = useState<ExamsStatusTab>("open");
  const [activateOpen, setActivateOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activateOfferingId, setActivateOfferingId] = useState("");
  const [activateIntegrity, setActivateIntegrity] = useState(false);
  const [activateTiming, setActivateTiming] = useState<ExamTimingForm>({
    durationMinutes: "45",
    warningMinutes: "10",
    autoSubmitOnTimeout: true,
  });
  const [confirmDeactivateSession, setConfirmDeactivateSession] = useState<ExamSession | null>(null);
  const [confirmCloseSession, setConfirmCloseSession] = useState<ExamSession | null>(null);
  const [deactivatingSessionId, setDeactivatingSessionId] = useState<number | null>(null);
  const [closingSessionId, setClosingSessionId] = useState<number | null>(null);
  const [examsRefreshKey, setExamsRefreshKey] = useState(0);

  const { open: openSessions, closed: closedSessions } = useMemo(
    () => splitSessions(sessions),
    [sessions],
  );

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
    setActivateTiming(timingFromExam(exam));
    setActivateOpen(true);
  };

  const activate = async () => {
    if (!selectedExam || !activateOfferingId) return;
    const timingError = validateExamTiming(activateTiming);
    if (timingError) {
      setError(timingError);
      return;
    }
    try {
      await api(`/api/exams/${selectedExam.id}/activate`, {
        method: "POST",
        body: JSON.stringify({
          offering_id: Number(activateOfferingId),
          integrity_mode_enabled: activateIntegrity,
          ...timingActivatePayload(activateTiming),
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
    <Box sx={{ width: "100%" }} dir="rtl">
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

      <ExamsStatusTabs
        value={examsTab}
        onChange={setExamsTab}
        openCount={openSessions.length}
        closedCount={closedSessions.length}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : examsTab === "open" ? (
        <OpenExamsTab
          sessions={openSessions}
          catalogs={catalogs}
          examsRefreshKey={examsRefreshKey}
          closingSessionId={closingSessionId}
          deactivatingSessionId={deactivatingSessionId}
          onCloseClick={setConfirmCloseSession}
          onDeactivateClick={setConfirmDeactivateSession}
          onActivate={openActivate}
          onError={setError}
          onChanged={refreshExams}
        />
      ) : (
        <ClosedExamsTab sessions={closedSessions} />
      )}

      <ActivateExamDialog
        open={activateOpen}
        exam={selectedExam}
        offerings={matchingOfferings}
        offeringId={activateOfferingId}
        integrity={activateIntegrity}
        timing={activateTiming}
        onOfferingChange={setActivateOfferingId}
        onIntegrityChange={setActivateIntegrity}
        onTimingChange={setActivateTiming}
        onClose={() => setActivateOpen(false)}
        onActivate={activate}
      />

      <CloseSessionDialog
        session={confirmCloseSession}
        closing={closingSessionId != null}
        onClose={() => setConfirmCloseSession(null)}
        onConfirm={closeSession}
      />

      <DeactivateSessionDialog
        session={confirmDeactivateSession}
        deactivating={deactivatingSessionId != null}
        onClose={() => setConfirmDeactivateSession(null)}
        onConfirm={deactivateSession}
      />
    </Box>
  );
}

function OpenExamsTab({
  sessions,
  catalogs,
  examsRefreshKey,
  closingSessionId,
  deactivatingSessionId,
  onCloseClick,
  onDeactivateClick,
  onActivate,
  onError,
  onChanged,
}: {
  sessions: ExamSession[];
  catalogs: CatalogCourse[];
  examsRefreshKey: number;
  closingSessionId: number | null;
  deactivatingSessionId: number | null;
  onCloseClick: (s: ExamSession) => void;
  onDeactivateClick: (s: ExamSession) => void;
  onActivate: (exam: Exam) => void;
  onError: (message: string) => void;
  onChanged: () => void;
}) {
  return (
    <>
      {sessions.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {he.noExams}
        </Typography>
      ) : (
        sessions.map((s) => (
          <ExamSessionCard
            key={s.id}
            session={s}
            closingSessionId={closingSessionId}
            deactivatingSessionId={deactivatingSessionId}
            onCloseClick={onCloseClick}
            onDeactivateClick={onDeactivateClick}
          />
        ))
      )}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {he.draftExams}
      </Typography>
      <CatalogExamsList
        key={examsRefreshKey}
        catalogs={catalogs}
        onActivate={onActivate}
        onError={onError}
        onChanged={onChanged}
      />
    </>
  );
}

function ClosedExamsTab({ sessions }: { sessions: ExamSession[] }) {
  if (sessions.length === 0) {
    return <Typography color="text.secondary">{he.noClosedExams}</Typography>;
  }
  return sessions.map((s) => <ExamSessionCard key={s.id} session={s} closedTab />);
}

function ExamSessionCard({
  session: s,
  closedTab = false,
  closingSessionId,
  deactivatingSessionId,
  onCloseClick,
  onDeactivateClick,
}: {
  session: ExamSession;
  closedTab?: boolean;
  closingSessionId?: number | null;
  deactivatingSessionId?: number | null;
  onCloseClick?: (s: ExamSession) => void;
  onDeactivateClick?: (s: ExamSession) => void;
}) {
  const gradesPath = `/teacher/courses/${s.offering_id}/exams/sessions/${s.id}/results`;

  return (
    <Card key={s.id} sx={{ mb: 1 }}>
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Box flex={1} minWidth={200}>
          <Typography fontWeight={600}>{s.exam_title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {s.catalog_name} — {s.group_name} ({s.academic_year}, {semesterLabel(s.semester)}) —{" "}
            {sessionStatusLabel(s.status)} — {s.question_count} שאלות
          </Typography>
        </Box>
        {closedTab ? (
          <Button
            size="small"
            variant="outlined"
            component={RouterLink}
            to={gradesPath}
            startIcon={<GradingIcon />}
          >
            {he.viewExamGrades}
          </Button>
        ) : (
          s.status === "active" && (
            <>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<DoneAllIcon />}
                disabled={closingSessionId === s.id}
                onClick={() => onCloseClick?.(s)}
              >
                {closingSessionId === s.id ? he.loading : he.closeExam}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<StopIcon />}
                disabled={deactivatingSessionId === s.id}
                onClick={() => onDeactivateClick?.(s)}
              >
                {deactivatingSessionId === s.id ? he.loading : he.cancelActivation}
              </Button>
            </>
          )
        )}
      </CardContent>
    </Card>
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

function ActivateExamDialog({
  open,
  exam,
  offerings,
  offeringId,
  integrity,
  timing,
  onOfferingChange,
  onIntegrityChange,
  onTimingChange,
  onClose,
  onActivate,
}: {
  open: boolean;
  exam: Exam | null;
  offerings: CourseOffering[];
  offeringId: string;
  integrity: boolean;
  timing: ExamTimingForm;
  onOfferingChange: (id: string) => void;
  onIntegrityChange: (v: boolean) => void;
  onTimingChange: (v: ExamTimingForm) => void;
  onClose: () => void;
  onActivate: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.activateExam}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {exam && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {exam.title}
          </Typography>
        )}
        <TextField
          select
          fullWidth
          label={he.myCourses}
          value={offeringId}
          onChange={(e) => onOfferingChange(e.target.value)}
        >
          {offerings.map((o) => (
            <MenuItem key={o.id} value={String(o.id)}>
              {offeringLabel(o)}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={<Checkbox checked={integrity} onChange={(e) => onIntegrityChange(e.target.checked)} />}
          label={he.integrityMode}
        />
        <Typography variant="caption" color="text.secondary" display="block">
          {he.integrityModeHint}
        </Typography>
        <ExamActivateTimingFields value={timing} onChange={onTimingChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <DisabledActionTooltip
          disabled={!offeringId}
          disabledReason={!offeringId ? he.selectOfferingToActivate : undefined}
        >
          <Button variant="contained" onClick={onActivate}>
            {he.activateExam}
          </Button>
        </DisabledActionTooltip>
      </DialogActions>
    </Dialog>
  );
}

function CloseSessionDialog({
  session,
  closing,
  onClose,
  onConfirm,
}: {
  session: ExamSession | null;
  closing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!session} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{he.closeExam}</DialogTitle>
      <DialogContent>
        <Typography>{he.closeExamConfirm}</Typography>
        {session && (
          <Typography fontWeight={600} sx={{ mt: 1 }}>
            {session.exam_title}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button variant="contained" color="primary" onClick={onConfirm} disabled={closing}>
          {closing ? he.loading : he.closeExam}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeactivateSessionDialog({
  session,
  deactivating,
  onClose,
  onConfirm,
}: {
  session: ExamSession | null;
  deactivating: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!session} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{he.cancelActivation}</DialogTitle>
      <DialogContent>
        <Typography>{he.cancelActivationConfirm}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button variant="contained" color="warning" onClick={onConfirm} disabled={deactivating}>
          {deactivating ? he.loading : he.cancelActivation}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
