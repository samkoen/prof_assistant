import { semesterLabel, type ExamSession } from "../../api/client";
import StatusChip from "../ui/StatusChip";
import { he } from "../../i18n/he";
import type { SessionBusy } from "../../hooks/useSessionLifecycle";
import { sessionStatusView } from "../../utils/examStatus";
import ExamListCard from "./ExamListCard";
import SessionCardActions, { type SessionCardHandlers } from "./SessionCardActions";

type ExamSessionCardProps = {
  session: ExamSession;
  closedTab?: boolean;
  busy: SessionBusy;
  handlers: SessionCardHandlers;
};

export function sessionMeta(s: ExamSession): string {
  const group = `${s.catalog_name} · ${s.group_name}`;
  const period = `${s.academic_year}, ${semesterLabel(s.semester)}`;
  return `${group} · ${period} · ${he.examsQuestionsLabel(s.question_count)}`;
}

/** Une session d'examen (brouillon, active ou close) avec son état et ses actions. */
export default function ExamSessionCard({ session, closedTab = false, busy, handlers }: ExamSessionCardProps) {
  const status = sessionStatusView(session);
  return (
    <ExamListCard
      title={session.exam_title}
      chip={<StatusChip label={status.label} tone={status.tone} />}
      meta={sessionMeta(session)}
      tone={status.tone}
      actions={<SessionCardActions session={session} closedTab={closedTab} busy={busy} handlers={handlers} />}
    />
  );
}
