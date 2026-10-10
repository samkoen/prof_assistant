import { useMemo, useState } from "react";
import { Alert, Box, Button, InputAdornment, Skeleton, TextField } from "@mui/material";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ListPageToolbar from "../../components/ListPageToolbar";
import BulkApproveDialog from "../../components/teacher/BulkApproveDialog";
import EnrollmentGroupPanel from "../../components/teacher/EnrollmentGroupPanel";
import EmptyState from "../../components/ui/EmptyState";
import { useBulkApproval } from "../../hooks/useBulkApproval";
import { useEnrollmentReview } from "../../hooks/useEnrollmentReview";
import { usePendingEnrollments } from "../../hooks/usePendingEnrollments";
import { he } from "../../i18n/he";
import { groupEnrollments, type EnrollmentGroup } from "../../utils/enrollmentGroups";

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={he.enrollmentsSearchPlaceholder}
      inputProps={{ "aria-label": he.enrollmentsSearchPlaceholder }}
      sx={{ mb: 2.5, width: { xs: "100%", sm: 360 } }}
      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
    />
  );
}

/** Demandes d'inscription : regroupées par cours, recherche, approbation groupée. */
export default function TeacherEnrollmentsPage() {
  const pending = usePendingEnrollments();
  const { reviewing, review } = useEnrollmentReview((id) => pending.remove([id]));
  const bulk = useBulkApproval(pending.remove);
  const [query, setQuery] = useState("");
  const [confirmGroup, setConfirmGroup] = useState<EnrollmentGroup | null>(null);
  const groups = useMemo(() => groupEnrollments(pending.rows, query), [pending.rows, query]);

  const confirmBulk = async () => {
    if (confirmGroup) await bulk.approveAll(confirmGroup.rows.map((r) => r.id));
    setConfirmGroup(null);
  };

  return (
    <Box dir="rtl">
      <ListPageToolbar
        title={he.pendingApprovals}
        subtitle={pending.rows.length > 0 ? he.enrollmentsCountTitle(pending.rows.length) : he.enrollmentsSubtitle}
      />
      {pending.error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => pending.setError("")} action={<Button color="inherit" size="small" onClick={pending.reload}>{he.retry}</Button>}>
          {pending.error}
        </Alert>
      )}
      {pending.rows.length > 0 && <SearchBox value={query} onChange={setQuery} />}
      {pending.loading ? (
        <Skeleton variant="rounded" height={200} />
      ) : pending.rows.length === 0 ? (
        <EmptyState title={he.noPendingRequests} description={he.noPendingRequestsHint} icon={<HowToRegOutlinedIcon />} />
      ) : groups.length === 0 ? (
        <EmptyState title={he.enrollmentsNoMatch} />
      ) : (
        groups.map((g) => (
          <EnrollmentGroupPanel key={g.offeringId} group={g} reviewing={reviewing} bulkBusy={bulk.busy} onReview={review} onApproveAll={setConfirmGroup} />
        ))
      )}
      <BulkApproveDialog group={confirmGroup} busy={bulk.busy} onClose={() => setConfirmGroup(null)} onConfirm={confirmBulk} />
    </Box>
  );
}
