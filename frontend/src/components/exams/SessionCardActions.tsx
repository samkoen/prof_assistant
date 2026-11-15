import { Box } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GradingIcon from "@mui/icons-material/GradingOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/StopOutlined";
import ExamPrimaryButton from "./ExamPrimaryButton";
import PracticeReleaseButtons from "./PracticeReleaseButtons";
import ActionsMenu, { type MenuAction } from "../ui/ActionsMenu";
import { examEditPath } from "../ExamActionButtons";
import type { ExamSession } from "../../api/client";
import type { SessionBusy } from "../../hooks/useSessionLifecycle";
import { he } from "../../i18n/he";
import { sessionPrimaryAction } from "../../utils/examPrimaryAction";
import { sessionTargetPath } from "../../utils/examStatus";
import type { SessionActionKind } from "./sessionActionCopy";

export type SessionCardHandlers = {
  onRequest: (kind: SessionActionKind, session: ExamSession) => void;
  onActivateSession: (session: ExamSession) => void;
  onChanged: () => void | Promise<void>;
  onError: (message: string) => void;
  onSuccess?: (message: string) => void;
};

type ActionsProps = {
  session: ExamSession;
  closedTab: boolean;
  busy: SessionBusy;
  handlers: SessionCardHandlers;
};

const RETURN_TO = "/teacher/exams";
const rowSx = { display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", flexShrink: 0 } as const;

function isPractice(session: ExamSession): boolean {
  return session.kind === "task" || Boolean(session.is_tirgoul);
}

function resultsPath(session: ExamSession): string {
  return `/teacher/courses/${session.offering_id}/exams/sessions/${session.id}/results`;
}

function menuActions(session: ExamSession, handlers: SessionCardHandlers, showGrades: boolean): MenuAction[] {
  const items: MenuAction[] = [
    { key: "edit", label: he.editExam, icon: <EditOutlinedIcon fontSize="small" />, to: examEditPath(session.exam_id, RETURN_TO) },
  ];
  if (showGrades) items.push({ key: "grades", label: he.viewExamGrades, icon: <GradingIcon fontSize="small" />, to: resultsPath(session) });
  if (!isPractice(session) && session.status === "active") {
    items.push({ key: "deactivate", label: he.cancelActivation, icon: <StopIcon fontSize="small" />, onClick: () => handlers.onRequest("deactivate", session) });
  }
  if (!isPractice(session) && session.status === "closed") {
    items.push({ key: "reopen", label: he.reopenExam, icon: <PlayArrowIcon fontSize="small" />, onClick: () => handlers.onRequest("reopen", session) });
  }
  return items;
}

function releaseProps(session: ExamSession, handlers: SessionCardHandlers) {
  return {
    practice: true,
    status: session.status,
    gradingLocked: session.grading_locked,
    hasContent: session.question_count > 0,
    examId: session.exam_id,
    sessionId: session.id,
    offeringId: session.offering_id,
    onChanged: handlers.onChanged,
    onError: handlers.onError,
    onSuccess: handlers.onSuccess,
  };
}

/** תרגול / משימה : envoi aux élèves, blocage de note, et publication pour une משימה. */
function PracticeActions({ session, busy, handlers }: Omit<ActionsProps, "closedTab">) {
  const canPublishTask = session.kind === "task" && session.status === "active" && !session.results_published && !session.grading_locked;
  return (
    <Box sx={rowSx}>
      <PracticeReleaseButtons {...releaseProps(session, handlers)} />
      {canPublishTask && (
        <ExamPrimaryButton kind="publish" loading={busy?.id === session.id} onPublish={() => handlers.onRequest("publish", session)} />
      )}
      <ActionsMenu actions={menuActions(session, handlers, session.status !== "draft")} />
    </Box>
  );
}

/** Un bouton principal selon l'état de la session + menu « ⋮ » pour les actions secondaires. */
export default function SessionCardActions({ session, busy, handlers }: ActionsProps) {
  if (isPractice(session)) return <PracticeActions session={session} busy={busy} handlers={handlers} />;
  const primary = sessionPrimaryAction(session);
  return (
    <Box sx={rowSx}>
      <ExamPrimaryButton
        kind={primary}
        loading={busy?.id === session.id}
        gradesPath={sessionTargetPath(session)}
        onActivate={() => handlers.onActivateSession(session)}
        onClose={() => handlers.onRequest("close", session)}
        onPublish={() => handlers.onRequest("publish", session)}
      />
      <ActionsMenu actions={menuActions(session, handlers, primary !== "grades" && session.status !== "draft")} />
    </Box>
  );
}
