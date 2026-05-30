import { Link as RouterLink } from "react-router-dom";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { hebrewActionsLeftSx } from "../styles/hebrewAlign";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GradingIcon from "@mui/icons-material/Grading";
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
  const canStart = !session || session.status === "draft";
  const canViewGrades = !!session && session.status !== "draft";
  const canClose = isActive && !!session;
  const canDeactivate = isActive && !!session;
  const showStart = (canStart && hasQuestions) || activatingId === exam.id;
  const showClose = canClose || closingSessionId === session?.id;
  const showDeactivate = canDeactivate || deactivatingSessionId === session?.id;
  const gradesPath = session
    ? `/teacher/courses/${courseId}/exams/sessions/${session.id}/results`
    : "#";
  const canEdit = exam.can_delete !== false;

  return (
    <Box sx={hebrewActionsLeftSx}>
      <ExamEditLink examId={exam.id} returnTo={returnTo} iconOnly viewOnly={!canEdit} />
      <ExamActionButtons
        exam={exam}
        onChanged={onChanged}
        onError={onError}
        iconOnly
        hideInactive
      />
      {canViewGrades && (
        <Tooltip title={he.viewExamGrades}>
          <IconButton
            size="small"
            component={RouterLink}
            to={gradesPath}
            color="primary"
            aria-label={he.viewExamGrades}
          >
            <GradingIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {showStart && (
        <Tooltip title={activatingId === exam.id ? he.loading : he.startExamNow}>
          <IconButton
            size="small"
            color="success"
            aria-label={he.startExamNow}
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
      )}
      {showClose && session && (
        <Tooltip title={closingSessionId === session.id ? he.loading : he.closeExam}>
          <IconButton
            size="small"
            color="primary"
            aria-label={he.closeExam}
            disabled={closingSessionId === session.id}
            onClick={() => onCloseClick(session)}
          >
            {closingSessionId === session.id ? (
              <CircularProgress size={18} />
            ) : (
              <DoneAllIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}
      {showDeactivate && session && (
        <Tooltip title={deactivatingSessionId === session.id ? he.loading : he.cancelActivation}>
          <IconButton
            size="small"
            color="warning"
            aria-label={he.cancelActivation}
            disabled={deactivatingSessionId === session.id}
            onClick={() => onDeactivateClick(session)}
          >
            {deactivatingSessionId === session.id ? (
              <CircularProgress size={18} />
            ) : (
              <StopIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
