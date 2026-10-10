import { Box, Button, Typography } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import type { ReviewAction } from "../PendingEnrollmentActions";
import StatusChip from "../ui/StatusChip";
import PendingRequestCard from "./PendingRequestCard";
import { he } from "../../i18n/he";
import type { EnrollmentGroup } from "../../utils/enrollmentGroups";

type EnrollmentGroupPanelProps = {
  group: EnrollmentGroup;
  reviewing: ReviewAction | null;
  bulkBusy: boolean;
  onReview: (id: number, status: "approved" | "rejected") => void;
  onApproveAll: (group: EnrollmentGroup) => void;
};

function GroupHeader({ group, bulkBusy, onApproveAll }: Pick<EnrollmentGroupPanelProps, "group" | "bulkBusy" | "onApproveAll">) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 1.25 }}>
      <Typography variant="h6" fontWeight={800}>
        {group.label}
      </Typography>
      <StatusChip label={String(group.rows.length)} tone="warning" />
      <Box sx={{ flex: 1 }} />
      {group.rows.length > 1 && (
        <Button size="small" variant="outlined" startIcon={<DoneAllIcon />} disabled={bulkBusy} onClick={() => onApproveAll(group)}>
          {he.enrollmentsApproveAll}
        </Button>
      )}
    </Box>
  );
}

/** Demandes d'un même groupe, avec approbation en un clic pour tout le groupe. */
export default function EnrollmentGroupPanel(props: EnrollmentGroupPanelProps) {
  const { group, reviewing, onReview } = props;
  return (
    <Box component="section" sx={{ mb: 3.5 }}>
      <GroupHeader group={group} bulkBusy={props.bulkBusy} onApproveAll={props.onApproveAll} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {group.rows.map((row) => (
          <PendingRequestCard key={row.id} enrollment={row} reviewing={reviewing} onReview={onReview} showOffering={false} />
        ))}
      </Box>
    </Box>
  );
}
