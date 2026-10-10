import { useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Alert, Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyIcon from "@mui/icons-material/Key";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import ExamAnswerKeyDialog from "../../components/ExamAnswerKeyDialog";
import ResultsStatGrid from "../../components/results/ResultsStatGrid";
import ResultsTable from "../../components/results/ResultsTable";
import ResultsToolbar from "../../components/results/ResultsToolbar";
import ScoreDistribution from "../../components/results/ScoreDistribution";
import BrandPageLoader from "../../components/ui/BrandPageLoader";
import EmptyState from "../../components/ui/EmptyState";
import PageHeroBanner from "../../components/ui/PageHeroBanner";
import { useResultsView } from "../../hooks/useResultsView";
import { useSessionResults } from "../../hooks/useSessionResults";
import { he } from "../../i18n/he";
import { computeResultsStats, scoreDistribution } from "../../utils/resultsStats";

/** Résultats d'une session : chiffres clés, histogramme, puis tableau filtrable et triable. */
export default function TeacherExamResultsPage() {
  const { courseId, sessionId } = useParams<{ courseId: string; sessionId: string }>();
  const { data, loading, error, setError, reload } = useSessionResults(Number(sessionId));
  const results = useMemo(() => data?.results ?? [], [data]);
  const stats = useMemo(() => computeResultsStats(results), [results]);
  const view = useResultsView(results);
  const [keyOpen, setKeyOpen] = useState(false);
  const [success, setSuccess] = useState("");

  if (loading && !data) return <BrandPageLoader />;
  if (!data) return <Alert severity="error">{error || he.errorGeneric}</Alert>;

  return (
    <Box dir="rtl" sx={{ width: "100%", minWidth: 0 }}>
      <Button component={RouterLink} to={`/teacher/courses/${courseId}/exams`} startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1 }}>
        {he.backToExams}
      </Button>
      <PageHeroBanner
        title={data.exam_title}
        subtitle={`${he.examResults} · ${data.offering_label}`}
        actions={<AnswerKeyButton allowed={data.can_correct_answer_key} onClick={() => setKeyOpen(true)} />}
      />
      {data.integrity_mode_enabled && <Alert severity="info" sx={{ mb: 2 }}>{he.integrityMode}: {he.integrityModeHint}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}
      <ResultsStatGrid stats={stats} />
      <ScoreDistribution buckets={scoreDistribution(results)} graded={stats.graded} />
      <ResultsToolbar query={view.query} status={view.status} stats={stats} onQueryChange={view.setQuery} onStatusChange={view.setStatus} />
      {results.length === 0 ? (
        <EmptyState title={he.noResultsYet} />
      ) : view.rows.length === 0 ? (
        <EmptyState title={he.resultsNoMatch} />
      ) : (
        <ResultsTable rows={view.rows} integrity={data.integrity_mode_enabled} sortKey={view.sortKey} direction={view.direction} onSort={view.toggleSort} />
      )}
      <ExamAnswerKeyDialog
        open={keyOpen}
        examId={data.exam_id}
        submittedCount={stats.submitted}
        onClose={() => setKeyOpen(false)}
        onSaved={(message) => {
          setSuccess(message);
          void reload();
        }}
      />
    </Box>
  );
}

function AnswerKeyButton({ allowed, onClick }: { allowed: boolean; onClick: () => void }) {
  return (
    <DisabledActionTooltip disabled={!allowed} disabledReason={allowed ? undefined : he.correctAnswerKeyBlocked}>
      <Button variant="contained" startIcon={<KeyIcon />} onClick={onClick} disabled={!allowed} sx={{ bgcolor: "#fff", color: "primary.dark", background: "#fff", "&:hover": { background: "#f5f3ff" } }}>
        {he.correctAnswerKey}
      </Button>
    </DisabledActionTooltip>
  );
}
