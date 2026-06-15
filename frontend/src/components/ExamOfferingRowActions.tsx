import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { hebrewActionsLeftSx } from "../styles/hebrewAlign";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GradingIcon from "@mui/icons-material/Grading";
import { ExamActionButtons, ExamEditLink, type ExamRowMenuExtra } from "./ExamActionButtons";
import type { Exam, ExamSession } from "../api/client";
import { he } from "../i18n/he";

type ExamOfferingRowActionsProps = {
  exam: Exam;
  session?: ExamSession;
  courseId: number;
  hasQuestions: boolean;
  activatingId: number | null;
  closingSessionId: number | null;
  deactivatingSessionId: number | null;
  reopeningSessionId: number | null;
  returnTo: string;
  onChanged: () => void;
  onError: (message: string) => void;
  onStartClick: (exam: Exam) => void;
  onCloseClick: (session: ExamSession) => void;
  onDeactivateClick: (session: ExamSession) => void;
  onReopenClick: (session: ExamSession) => void;
};

function LifecycleAction({
  showDeactivate,
  showReopen,
  showStart,
  showStartBlocked,
  session,
  examId,
  activatingId,
  deactivatingSessionId,
  reopeningSessionId,
  onStartClick,
  onDeactivateClick,
  onReopenClick,
  exam,
}: {
  showDeactivate: boolean;
  showReopen: boolean;
  showStart: boolean;
  showStartBlocked: boolean;
  session?: ExamSession;
  examId: number;
  activatingId: number | null;
  deactivatingSessionId: number | null;
  reopeningSessionId: number | null;
  onStartClick: (exam: Exam) => void;
  onDeactivateClick: (session: ExamSession) => void;
  onReopenClick: (session: ExamSession) => void;
  exam: Exam;
}) {
  if (showDeactivate && session) {
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
  if (showReopen && session) {
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
  if (showStart) {
    return (
      <Tooltip title={activatingId === examId ? he.loading : he.activateExam}>
        <IconButton
          size="small"
          color="success"
          aria-label={he.activateExam}
          disabled={activatingId === examId}
          onClick={() => onStartClick(exam)}
        >
          {activatingId === examId ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <PlayArrowIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    );
  }
  if (showStartBlocked) {
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

export default function ExamOfferingRowActions({
  exam,
  session,
  courseId,
  hasQuestions,
  activatingId,
  closingSessionId,
  deactivatingSessionId,
  reopeningSessionId,
  returnTo,
  onChanged,
  onError,
  onStartClick,
  onCloseClick,
  onDeactivateClick,
  onReopenClick,
}: ExamOfferingRowActionsProps) {
  const navigate = useNavigate();
  const isActive = session?.status === "active";
  const canStart = !session || session.status === "draft";
  const canViewGrades = !!session && session.status !== "draft";
  const showClose =
    !!session &&
    (session.status === "active" || (session.status === "closed" && !session.results_published));
  const showDeactivate = isActive && !!session;
  const showReopen = session?.status === "closed";
  const showStart = (canStart && hasQuestions) || activatingId === exam.id;
  const showStartBlocked = canStart && !hasQuestions && activatingId !== exam.id;
  const canEdit = exam.can_delete !== false;
  const canDelete = exam.can_delete !== false;
  const gradesPath = session
    ? `/teacher/courses/${courseId}/exams/sessions/${session.id}/results`
    : "";

  const menuExtras = useMemo(() => {
    const items: ExamRowMenuExtra[] = [];
    if (showClose && session) {
      items.push({
        key: "close",
        label: closingSessionId === session.id ? he.loading : he.closeExam,
        icon: <DoneAllIcon fontSize="small" />,
        disabled: closingSessionId === session.id,
        onClick: () => onCloseClick(session),
      });
    }
    if (canViewGrades && gradesPath) {
      items.push({
        key: "grades",
        label: he.viewExamGrades,
        icon: <GradingIcon fontSize="small" />,
        onClick: () => navigate(gradesPath),
      });
    }
    return items;
  }, [
    showClose,
    session,
    closingSessionId,
    canViewGrades,
    gradesPath,
    onCloseClick,
    navigate,
  ]);

  return (
    <Box sx={hebrewActionsLeftSx}>
      <ExamEditLink examId={exam.id} returnTo={returnTo} iconOnly viewOnly={!canEdit} />
      <LifecycleAction
        showDeactivate={showDeactivate || deactivatingSessionId === session?.id}
        showReopen={showReopen || reopeningSessionId === session?.id}
        showStart={showStart}
        showStartBlocked={showStartBlocked}
        session={session}
        examId={exam.id}
        activatingId={activatingId}
        deactivatingSessionId={deactivatingSessionId}
        reopeningSessionId={reopeningSessionId}
        onStartClick={onStartClick}
        onDeactivateClick={onDeactivateClick}
        onReopenClick={onReopenClick}
        exam={exam}
      />
      <ExamActionButtons
        exam={exam}
        onChanged={onChanged}
        onError={onError}
        iconOnly
        courseRowLayout
        primaryAction={canDelete ? "delete" : "duplicate"}
        menuExtras={menuExtras}
      />
    </Box>
  );
}
