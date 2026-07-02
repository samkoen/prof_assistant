import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GradingIcon from "@mui/icons-material/Grading";
import LinkIcon from "@mui/icons-material/Link";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ExamActivateTimingFields from "./ExamActivateTimingFields";
import StudentExamLinkButton from "./StudentExamLinkButton";
import { ExamActionButtons, ExamEditLink, type ExamRowMenuExtra } from "./ExamActionButtons";
import { api, ApiError, type Exam, type ExamSession } from "../api/client";
import { hebrewActionsLeftSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";
import {
  timingActivatePayload,
  timingFromExam,
  validateExamTiming,
  type ExamTimingForm,
} from "../utils/examActivateTiming";
import { getExamOfferingActionRules } from "../utils/examOfferingActionRules";
import { copyStudentExamLink } from "../utils/studentExamLink";

type ExamContextActionsBarProps = {
  exam: Exam;
  session?: ExamSession;
  courseId?: number;
  returnTo: string;
  hasQuestions?: boolean;
  showEditLink?: boolean;
  /** Tableau : une action inline + menu ⋮. Page examen : toutes les icônes visibles. */
  compactMenu?: boolean;
  onChanged: () => void | Promise<void>;
  onError: (message: string) => void;
  onSuccess?: (message: string) => void;
  onDeleted?: () => void;
  onReopened?: () => void;
};

function LifecycleActionButton({
  rules,
  session,
  exam,
  activatingId,
  deactivatingSessionId,
  reopeningSessionId,
  onStartClick,
  onDeactivateClick,
  onReopenClick,
}: {
  rules: ReturnType<typeof getExamOfferingActionRules>;
  session?: ExamSession;
  exam: Exam;
  activatingId: number | null;
  deactivatingSessionId: number | null;
  reopeningSessionId: number | null;
  onStartClick: (exam: Exam) => void;
  onDeactivateClick: (session: ExamSession) => void;
  onReopenClick: (session: ExamSession) => void;
}) {
  if ((rules.showDeactivate || deactivatingSessionId === session?.id) && session) {
    return (
      <Tooltip title={deactivatingSessionId === session.id ? he.loading : he.cancelActivation}>
        <IconButton
          size="small"
          color="warning"
          aria-label={he.cancelActivation}
          disabled={deactivatingSessionId === session.id}
          onClick={() => onDeactivateClick(session)}
        >
          {deactivatingSessionId === session.id ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <StopIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    );
  }
  if ((rules.showReopen || reopeningSessionId === session?.id) && session) {
    return (
      <Tooltip title={reopeningSessionId === session.id ? he.loading : he.reopenExam}>
        <IconButton
          size="small"
          color="success"
          aria-label={he.reopenExam}
          disabled={reopeningSessionId === session.id}
          onClick={() => onReopenClick(session)}
        >
          {reopeningSessionId === session.id ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <PlayArrowIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    );
  }
  if (rules.showStart) {
    return (
      <Tooltip title={activatingId === exam.id ? he.loading : he.activateExam}>
        <IconButton
          size="small"
          color="success"
          aria-label={he.activateExam}
          disabled={activatingId === exam.id}
          onClick={() => onStartClick(exam)}
        >
          {activatingId === exam.id ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <PlayArrowIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    );
  }
  if (rules.showStartBlocked) {
    return (
      <Tooltip title={he.noQuestionsYet}>
        <span>
          <IconButton size="small" color="success" aria-label={he.activateExam} disabled>
            <PlayArrowIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    );
  }
  return null;
}

function SessionExtraIconButtons({
  rules,
  session,
  closingSessionId,
  onCloseClick,
}: {
  rules: ReturnType<typeof getExamOfferingActionRules>;
  session?: ExamSession;
  closingSessionId: number | null;
  onCloseClick: (session: ExamSession) => void;
}) {
  return (
    <>
      {rules.showClose && session && (
        <Tooltip title={closingSessionId === session.id ? he.loading : he.closeExam}>
          <IconButton
            size="small"
            color="primary"
            aria-label={he.closeExam}
            disabled={closingSessionId === session.id}
            onClick={() => onCloseClick(session)}
          >
            {closingSessionId === session.id ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <DoneAllIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}
      {rules.canViewGrades && rules.gradesPath && (
        <Tooltip title={he.viewExamGrades}>
          <IconButton
            component={RouterLink}
            to={rules.gradesPath}
            size="small"
            color="primary"
            aria-label={he.viewExamGrades}
          >
            <GradingIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
}

export default function ExamContextActionsBar({
  exam,
  session,
  courseId,
  returnTo,
  hasQuestions = exam.question_count > 0,
  showEditLink = false,
  compactMenu = true,
  onChanged,
  onError,
  onSuccess,
  onDeleted,
  onReopened,
}: ExamContextActionsBarProps) {
  const navigate = useNavigate();
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [deactivatingSessionId, setDeactivatingSessionId] = useState<number | null>(null);
  const [closingSessionId, setClosingSessionId] = useState<number | null>(null);
  const [reopeningSessionId, setReopeningSessionId] = useState<number | null>(null);
  const [activateExam, setActivateExam] = useState<Exam | null>(null);
  const [activateIntegrity, setActivateIntegrity] = useState(false);
  const [activateTiming, setActivateTiming] = useState<ExamTimingForm>({
    durationMinutes: "45",
    warningMinutes: "10",
    autoSubmitOnTimeout: true,
  });
  const [closeSession, setCloseSession] = useState<ExamSession | null>(null);
  const [confirmSession, setConfirmSession] = useState<ExamSession | null>(null);
  const [reopenSession, setReopenSession] = useState<ExamSession | null>(null);

  const rules = getExamOfferingActionRules(exam, session, courseId, hasQuestions, activatingId);
  const canEdit = exam.can_delete !== false;
  const hasOfferingContext = courseId != null && !Number.isNaN(courseId);

  const menuExtras = useMemo(() => {
    const items: ExamRowMenuExtra[] = [];
    if (rules.showStudentLink && session && courseId) {
      items.push({
        key: "student-link",
        label: he.copyStudentExamLink,
        icon: <LinkIcon fontSize="small" />,
        onClick: () => {
          void copyStudentExamLink(courseId, session.id)
            .then(() => onSuccess?.(he.studentExamLinkCopied))
            .catch(() => onError(he.portableExportCopyFailed));
        },
      });
    }
    if (rules.showClose && session) {
      items.push({
        key: "close",
        label: closingSessionId === session.id ? he.loading : he.closeExam,
        icon: <DoneAllIcon fontSize="small" />,
        disabled: closingSessionId === session.id,
        onClick: () => setCloseSession(session),
      });
    }
    if (rules.canViewGrades && rules.gradesPath) {
      items.push({
        key: "grades",
        label: he.viewExamGrades,
        icon: <GradingIcon fontSize="small" />,
        onClick: () => navigate(rules.gradesPath),
      });
    }
    return items;
  }, [rules, session, courseId, closingSessionId, navigate, onSuccess, onError]);

  const confirmStartExam = async () => {
    if (!activateExam || !hasOfferingContext) return;
    const timingError = validateExamTiming(activateTiming);
    if (timingError) {
      onError(timingError);
      return;
    }
    setActivatingId(activateExam.id);
    try {
      await api(`/api/exams/${activateExam.id}/activate`, {
        method: "POST",
        body: JSON.stringify({
          offering_id: courseId,
          integrity_mode_enabled: activateIntegrity,
          ...timingActivatePayload(activateTiming),
        }),
      });
      onSuccess?.(`${he.examActivated}: ${activateExam.title}`);
      setActivateExam(null);
      await onChanged();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setActivatingId(null);
    }
  };

  const closeExamSession = async () => {
    if (!closeSession) return;
    setClosingSessionId(closeSession.id);
    try {
      await api(`/api/exams/sessions/${closeSession.id}/close`, { method: "POST" });
      onSuccess?.(`${he.examClosedSuccess}: ${closeSession.exam_title}`);
      setCloseSession(null);
      await onChanged();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setClosingSessionId(null);
    }
  };

  const deactivateExam = async () => {
    if (!confirmSession) return;
    setDeactivatingSessionId(confirmSession.id);
    try {
      await api(`/api/exams/sessions/${confirmSession.id}/deactivate`, { method: "POST" });
      onSuccess?.(`${he.examDeactivated}: ${confirmSession.exam_title}`);
      setConfirmSession(null);
      await onChanged();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setDeactivatingSessionId(null);
    }
  };

  const reopenExamSession = async () => {
    if (!reopenSession) return;
    setReopeningSessionId(reopenSession.id);
    try {
      await api(`/api/exams/sessions/${reopenSession.id}/reopen`, { method: "POST" });
      onSuccess?.(`${he.examReopened}: ${reopenSession.exam_title}`);
      setReopenSession(null);
      onReopened?.();
      await onChanged();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setReopeningSessionId(null);
    }
  };

  return (
    <>
      <Box sx={hebrewActionsLeftSx}>
        {showEditLink && (
          <ExamEditLink examId={exam.id} returnTo={returnTo} iconOnly viewOnly={!canEdit} />
        )}
        {hasOfferingContext && (
          <LifecycleActionButton
            rules={rules}
            session={session}
            exam={exam}
            activatingId={activatingId}
            deactivatingSessionId={deactivatingSessionId}
            reopeningSessionId={reopeningSessionId}
            onStartClick={(target) => {
              setActivateIntegrity(false);
              setActivateTiming(timingFromExam(target));
              setActivateExam(target);
            }}
            onDeactivateClick={setConfirmSession}
            onReopenClick={setReopenSession}
          />
        )}
        {!compactMenu && rules.showStudentLink && session && courseId && (
          <StudentExamLinkButton
            offeringId={courseId}
            sessionId={session.id}
            onCopied={onSuccess}
            onError={onError}
          />
        )}
        {!compactMenu && (
          <SessionExtraIconButtons
            rules={rules}
            session={session}
            closingSessionId={closingSessionId}
            onCloseClick={setCloseSession}
          />
        )}
        <ExamActionButtons
          exam={exam}
          onChanged={onChanged}
          onDeleted={onDeleted}
          onError={onError}
          iconOnly
          courseRowLayout={compactMenu}
          primaryAction={rules.canDelete ? "delete" : "duplicate"}
          menuExtras={compactMenu ? menuExtras : []}
        />
      </Box>

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
            onClick={() => void confirmStartExam()}
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
            onClick={() => void closeExamSession()}
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
            onClick={() => void deactivateExam()}
            disabled={deactivatingSessionId != null}
          >
            {deactivatingSessionId != null ? he.loading : he.cancelActivation}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!reopenSession} onClose={() => setReopenSession(null)} fullWidth maxWidth="xs">
        <DialogTitle>{he.reopenExam}</DialogTitle>
        <DialogContent>
          <Typography>{he.reopenExamConfirm}</Typography>
          {reopenSession && (
            <Typography fontWeight={600} sx={{ mt: 1 }}>
              {reopenSession.exam_title}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReopenSession(null)}>{he.cancel}</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => void reopenExamSession()}
            disabled={reopeningSessionId != null}
          >
            {reopeningSessionId != null ? he.loading : he.reopenExam}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
