import { Link as RouterLink } from "react-router-dom";
import { CircularProgress, IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GradingIcon from "@mui/icons-material/Grading";
import DisabledActionTooltip from "./DisabledActionTooltip";
import { ExamActionButtons, ExamEditLink } from "./ExamActionButtons";
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
  returnTo: string;
  onChanged: () => void;
  onError: (message: string) => void;
  onStartClick: (exam: Exam) => void;
  onCloseClick: (session: ExamSession) => void;
  onDeactivateClick: (session: ExamSession) => void;
};

function playDisabledReason(
  canStart: boolean,
  hasQuestions: boolean,
  isActive: boolean,
  isClosed: boolean
): string | undefined {
  if (!hasQuestions) return he.noQuestionsYet;
  if (!canStart) {
    if (isActive) return he.examAlreadyActive;
    if (isClosed) return he.examClosed;
    return he.examNotActive;
  }
  return undefined;
}

export default function ExamOfferingRowActions({
  exam,
  session,
  courseId,
  hasQuestions,
  activatingId,
  closingSessionId,
  deactivatingSessionId,
  returnTo,
  onChanged,
  onError,
  onStartClick,
  onCloseClick,
  onDeactivateClick,
}: ExamOfferingRowActionsProps) {
  const isActive = session?.status === "active";
  const isClosed = session?.status === "closed";
  const canStart = !session || session.status === "draft";
  const canViewGrades = !!session && session.status !== "draft";
  const canClose = isActive && !!session;
  const canDeactivate = isActive && !!session;
  const playDisabled = !canStart || !hasQuestions || activatingId === exam.id;
  const playReason = playDisabledReason(canStart, hasQuestions, !!isActive, !!isClosed);
  const gradesPath = session
    ? `/teacher/courses/${courseId}/exams/sessions/${session.id}/results`
    : "#";
  const canEdit = exam.can_delete !== false;

  return (
    <>
      <ExamEditLink examId={exam.id} returnTo={returnTo} iconOnly disabled={!canEdit} />
      <ExamActionButtons exam={exam} onChanged={onChanged} onError={onError} iconOnly />
      <DisabledActionTooltip
        disabled={!canViewGrades}
        disabledReason={he.examNotActive}
        title={he.viewExamGrades}
      >
        <IconButton
          size="small"
          disabled={!canViewGrades}
          component={canViewGrades ? RouterLink : "button"}
          to={canViewGrades ? gradesPath : undefined}
          color={canViewGrades ? "primary" : "default"}
          aria-label={he.viewExamGrades}
        >
          <GradingIcon fontSize="small" />
        </IconButton>
      </DisabledActionTooltip>
      <DisabledActionTooltip
        disabled={playDisabled}
        disabledReason={playReason}
        title={activatingId === exam.id ? he.loading : he.startExamNow}
      >
        <IconButton
          size="small"
          disabled={playDisabled}
          color={!playDisabled ? "success" : "default"}
          aria-label={he.startExamNow}
          onClick={() => onStartClick(exam)}
        >
          {activatingId === exam.id ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <PlayArrowIcon fontSize="small" />
          )}
        </IconButton>
      </DisabledActionTooltip>
      <DisabledActionTooltip
        disabled={!canClose}
        disabledReason={he.examNotActive}
        title={closingSessionId === session?.id ? he.loading : he.closeExam}
      >
        <IconButton
          size="small"
          disabled={!canClose || closingSessionId === session?.id}
          color={canClose ? "primary" : "default"}
          aria-label={he.closeExam}
          onClick={() => session && onCloseClick(session)}
        >
          {closingSessionId === session?.id ? (
            <CircularProgress size={18} />
          ) : (
            <DoneAllIcon fontSize="small" />
          )}
        </IconButton>
      </DisabledActionTooltip>
      <DisabledActionTooltip
        disabled={!canDeactivate}
        disabledReason={he.examNotActive}
        title={deactivatingSessionId === session?.id ? he.loading : he.cancelActivation}
      >
        <IconButton
          size="small"
          disabled={!canDeactivate || deactivatingSessionId === session?.id}
          color={canDeactivate ? "warning" : "default"}
          aria-label={he.cancelActivation}
          onClick={() => session && onDeactivateClick(session)}
        >
          {deactivatingSessionId === session?.id ? (
            <CircularProgress size={18} />
          ) : (
            <StopIcon fontSize="small" />
          )}
        </IconButton>
      </DisabledActionTooltip>
    </>
  );
}
