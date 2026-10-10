import { Box } from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import EmptyState from "../ui/EmptyState";
import SectionHeader from "../ui/SectionHeader";
import DraftExamsList from "./DraftExamsList";
import ExamSessionCard from "./ExamSessionCard";
import type { SessionCardHandlers } from "./SessionCardActions";
import type { CatalogCourse, Exam, ExamSession } from "../../api/client";
import type { SessionBusy } from "../../hooks/useSessionLifecycle";
import { he } from "../../i18n/he";
import { hasActiveFilters, type ExamFilters } from "../../utils/examFilters";

type SessionsProps = {
  sessions: ExamSession[];
  filters: ExamFilters;
  busy: SessionBusy;
  handlers: SessionCardHandlers;
};

type OpenPanelProps = SessionsProps & {
  catalogs: CatalogCourse[];
  refreshKey: number;
  onActivate: (exam: Exam) => void;
  onError: (message: string) => void;
  onChanged: () => void;
  onCreate: () => void;
};

function SessionList({ sessions, busy, handlers, closedTab }: Omit<SessionsProps, "filters"> & { closedTab?: boolean }) {
  return (
    <>
      {sessions.map((s) => (
        <ExamSessionCard key={s.id} session={s} closedTab={closedTab} busy={busy} handlers={handlers} />
      ))}
    </>
  );
}

function OpenSessions({ sessions, filters, busy, handlers }: SessionsProps) {
  if (sessions.length > 0) return <SessionList sessions={sessions} busy={busy} handlers={handlers} />;
  if (hasActiveFilters(filters)) return <EmptyState title={he.examsFilterNoResults} />;
  return <EmptyState title={he.examsNoOpenTitle} description={he.examsNoOpenHint} icon={<EventAvailableOutlinedIcon />} />;
}

/** Onglet « פעילים וטיוטות » : sessions en cours puis examens prêts à activer. */
export function OpenExamsPanel(props: OpenPanelProps) {
  return (
    <Box>
      <SectionHeader title={he.examsSessionsSection} />
      <OpenSessions sessions={props.sessions} filters={props.filters} busy={props.busy} handlers={props.handlers} />
      <Box sx={{ mt: 4 }}>
        <SectionHeader title={he.draftExams} />
        <DraftExamsList
          catalogs={props.catalogs}
          filters={props.filters}
          refreshKey={props.refreshKey}
          onActivate={props.onActivate}
          onError={props.onError}
          onChanged={props.onChanged}
          onCreate={props.onCreate}
        />
      </Box>
    </Box>
  );
}

/** Onglet « סגורים ». */
export function ClosedExamsPanel({ sessions, filters, busy, handlers }: SessionsProps) {
  if (sessions.length > 0) return <SessionList sessions={sessions} busy={busy} handlers={handlers} closedTab />;
  if (hasActiveFilters(filters)) return <EmptyState title={he.examsFilterNoResults} />;
  return <EmptyState title={he.noClosedExams} description={he.examsNoClosedHint} icon={<InventoryOutlinedIcon />} />;
}