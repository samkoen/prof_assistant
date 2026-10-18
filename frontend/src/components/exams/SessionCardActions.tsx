import { Link as RouterLink } from "react-router-dom";
import { Box, Button } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GradingIcon from "@mui/icons-material/Grading";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { ExamEditLink } from "../ExamActionButtons";
import LoadingButton from "../ui/LoadingButton";
import type { ExamSession } from "../../api/client";
import type { SessionBusy } from "../../hooks/useSessionLifecycle";
import { he } from "../../i18n/he";
import { sessionTargetPath } from "../../utils/examStatus";
import type { SessionActionKind } from "./sessionActionCopy";

export type SessionCardHandlers = {
  onRequest: (kind: SessionActionKind, session: ExamSession) => void;
  onActivateSession: (session: ExamSession) => void;
};

type ActionsProps = {
  session: ExamSession;
  closedTab: boolean;
  busy: SessionBusy;
  handlers: SessionCardHandlers;
};

const rowSx = { display: "flex", gap: 1, flexWrap: "wrap", flexShrink: 0 } as const;

function isBusy(busy: SessionBusy, kind: SessionActionKind, id: number): boolean {
  return busy?.kind === kind && busy.id === id;
}

function GradesButton({ session }: { session: ExamSession }) {
  return (
    <Button size="small" variant="outlined" component={RouterLink} to={sessionTargetPath(session)} startIcon={<GradingIcon />}>
      {he.viewExamGrades}
    </Button>
  );
}

function CloseButton({ session, busy, handlers }: Omit<ActionsProps, "closedTab">) {
  return (
    <LoadingButton
      size="small"
      variant="contained"
      startIcon={<DoneAllIcon />}
      loading={isBusy(busy, "close", session.id)}
      onClick={() => handlers.onRequest("close", session)}
    >
      {he.closeExam}
    </LoadingButton>
  );
}

function DraftActions({ session, handlers }: Pick<ActionsProps, "session" | "handlers">) {
  return (
    <Box sx={rowSx}>
      <ExamEditLink examId={session.exam_id} returnTo="/teacher/exams" />
      <Button size="small" variant="contained" color="success" disabled={session.question_count < 1} onClick={() => handlers.onActivateSession(session)}>
        {he.activateExam}
      </Button>
    </Box>
  );
}

function ActiveActions({ session, busy, handlers }: Omit<ActionsProps, "closedTab">) {
  return (
    <Box sx={rowSx}>
      <CloseButton session={session} busy={busy} handlers={handlers} />
      <LoadingButton
        size="small"
        variant="outlined"
        color="warning"
        startIcon={<StopIcon />}
        loading={isBusy(busy, "deactivate", session.id)}
        onClick={() => handlers.onRequest("deactivate", session)}
      >
        {he.cancelActivation}
      </LoadingButton>
    </Box>
  );
}

function ClosedActions({ session, busy, handlers }: Omit<ActionsProps, "closedTab">) {
  return (
    <Box sx={rowSx}>
      <LoadingButton
        size="small"
        variant="contained"
        color="success"
        startIcon={<PlayArrowIcon />}
        loading={isBusy(busy, "reopen", session.id)}
        onClick={() => handlers.onRequest("reopen", session)}
      >
        {he.reopenExam}
      </LoadingButton>
      {!session.results_published && <CloseButton session={session} busy={busy} handlers={handlers} />}
      <GradesButton session={session} />
    </Box>
  );
}

function TaskActions({ session, busy, handlers }: Omit<ActionsProps, "closedTab">) {
  return (
    <Box sx={rowSx}>
      <ExamEditLink examId={session.exam_id} returnTo="/teacher/exams" />
      {session.status === "active" && !session.results_published && (
        <LoadingButton size="small" variant="contained" loading={isBusy(busy, "close", session.id)} onClick={() => handlers.onRequest("close", session)}>
          {he.taskPublish}
        </LoadingButton>
      )}
      <GradesButton session={session} />
    </Box>
  );
}

function PracticeActions({ session }: { session: ExamSession }) {
  return (
    <Box sx={rowSx}>
      <ExamEditLink examId={session.exam_id} returnTo="/teacher/exams" />
      <GradesButton session={session} />
    </Box>
  );
}

/** Actions disponibles selon l'état de la session (pratique, brouillon, actif, clos). */
export default function SessionCardActions({ session, closedTab, busy, handlers }: ActionsProps) {
  if (session.kind === "task") return <TaskActions session={session} busy={busy} handlers={handlers} />;
  if (session.is_tirgoul) return <PracticeActions session={session} />;
  if (closedTab) return <ClosedActions session={session} busy={busy} handlers={handlers} />;
  if (session.status === "draft") return <DraftActions session={session} handlers={handlers} />;
  if (session.status === "active") return <ActiveActions session={session} busy={busy} handlers={handlers} />;
  return null;
}
