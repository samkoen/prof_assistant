import { useMemo } from "react";
import { Skeleton } from "@mui/material";
import ExamsStatusTabs, { type ExamsStatusTab } from "../ExamsStatusTabs";
import { ClosedExamsPanel, OpenExamsPanel } from "./ExamsTabPanels";
import type { SessionCardHandlers } from "./SessionCardActions";
import type { CatalogCourse, Exam, ExamSession } from "../../api/client";
import type { SessionBusy } from "../../hooks/useSessionLifecycle";
import { filterSessions, type ExamFilters } from "../../utils/examFilters";

type ExamsPageBodyProps = {
  sessions: ExamSession[];
  catalogs: CatalogCourse[];
  loading: boolean;
  filters: ExamFilters;
  tab: ExamsStatusTab;
  refreshKey: number;
  busy: SessionBusy;
  handlers: SessionCardHandlers;
  onTabChange: (tab: ExamsStatusTab) => void;
  onActivate: (exam: Exam) => void;
  onError: (message: string) => void;
  onChanged: () => void;
  onCreate: () => void;
};

function useSplitSessions(sessions: ExamSession[], filters: ExamFilters) {
  return useMemo(() => {
    const visible = filterSessions(sessions, filters);
    return {
      open: visible.filter((s) => s.status !== "closed"),
      closed: visible.filter((s) => s.status === "closed"),
    };
  }, [sessions, filters]);
}

/** Onglets + panneau actif ; les compteurs reflètent le filtre courant. */
export default function ExamsPageBody(props: ExamsPageBodyProps) {
  const { open, closed } = useSplitSessions(props.sessions, props.filters);
  const common = { filters: props.filters, busy: props.busy, handlers: props.handlers };
  return (
    <>
      <ExamsStatusTabs value={props.tab} onChange={props.onTabChange} openCount={open.length} closedCount={closed.length} />
      {props.loading ? (
        <Skeleton variant="rounded" height={220} />
      ) : props.tab === "open" ? (
        <OpenExamsPanel
          {...common}
          sessions={open}
          catalogs={props.catalogs}
          refreshKey={props.refreshKey}
          onActivate={props.onActivate}
          onError={props.onError}
          onChanged={props.onChanged}
          onCreate={props.onCreate}
        />
      ) : (
        <ClosedExamsPanel {...common} sessions={closed} />
      )}
    </>
  );
}
