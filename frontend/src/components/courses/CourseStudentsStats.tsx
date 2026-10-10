import { Grid } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BlockIcon from "@mui/icons-material/Block";
import StatCard from "../ui/StatCard";
import { he } from "../../i18n/he";
import type { EnrollmentStatus } from "../../utils/enrollmentStatus";

/** Répartition des inscriptions du groupe : approuvés / en attente / refusés. */
export default function CourseStudentsStats({ counts }: { counts: Record<EnrollmentStatus, number> }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={4}>
        <StatCard label={he.courseStudentsApproved} value={counts.approved} icon={<CheckCircleOutlineIcon />} tone="success" />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard label={he.courseStudentsPending} value={counts.pending} icon={<HourglassEmptyIcon />} tone="warning" />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard label={he.courseStudentsRejected} value={counts.rejected} icon={<BlockIcon />} tone="neutral" />
      </Grid>
    </Grid>
  );
}
