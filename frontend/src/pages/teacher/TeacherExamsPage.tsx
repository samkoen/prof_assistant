import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box } from "@mui/material";
import ActivateExamDialog from "../../components/exams/ActivateExamDialog";
import ConfirmSessionDialog from "../../components/exams/ConfirmSessionDialog";
import ExamsFilterBar from "../../components/exams/ExamsFilterBar";
import ExamsPageBody from "../../components/exams/ExamsPageBody";
import { type ExamsStatusTab } from "../../components/ExamsStatusTabs";
import ListPageToolbar from "../../components/ListPageToolbar";
import { useActivateExam } from "../../hooks/useActivateExam";
import { useSessionLifecycle } from "../../hooks/useSessionLifecycle";
import { useTeacherExams } from "../../hooks/useTeacherExams";
import { he } from "../../i18n/he";
import { catalogNames, NO_FILTERS } from "../../utils/examFilters";

/** Page « מבחנים » : recherche, onglets ouverts/clos, activation et clôture. */
export default function TeacherExamsPage() {
  const navigate = useNavigate();
  const data = useTeacherExams();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [tab, setTab] = useState<ExamsStatusTab>("open");
  const [refreshKey, setRefreshKey] = useState(0);
  const lifecycle = useSessionLifecycle({ reload: data.load, onError: data.setError, onReopened: () => setTab("open") });
  const activation = useActivateExam({ offerings: data.offerings, reload: data.load, onError: data.setError });
  const handlers = { onRequest: lifecycle.request, onActivateSession: activation.startFromSession };
  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    data.load();
  }, [data.load]);
  const names = useMemo(() => catalogNames(data.catalogs.map((c) => c.name)), [data.catalogs]);

  return (
    <Box sx={{ width: "100%" }} dir="rtl">
      <ListPageToolbar title={he.exams} subtitle={he.examsDraftsSubtitle} addLabel={he.createExam} onAdd={() => navigate("/teacher/exams/new")} />
      {data.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => data.setError("")}>{data.error}</Alert>}
      <ExamsFilterBar filters={filters} catalogs={names} onChange={setFilters} />
      <ExamsPageBody
        sessions={data.sessions}
        catalogs={data.catalogs}
        loading={data.loading}
        filters={filters}
        tab={tab}
        refreshKey={refreshKey}
        busy={lifecycle.busy}
        handlers={handlers}
        onTabChange={setTab}
        onActivate={activation.start}
        onError={data.setError}
        onChanged={refresh}
        onCreate={() => navigate("/teacher/exams/new")}
      />
      <ActivateExamDialog {...activation.dialog} />
      <ConfirmSessionDialog
        kind={lifecycle.pending?.kind ?? null}
        session={lifecycle.pending?.session ?? null}
        busy={lifecycle.busy !== null}
        onClose={lifecycle.cancel}
        onConfirm={lifecycle.confirm}
      />
    </Box>
  );
}
