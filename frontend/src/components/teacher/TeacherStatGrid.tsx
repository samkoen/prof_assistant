import { Grid } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesomeOutlined";
import GradingIcon from "@mui/icons-material/GradingOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import type { WalletBalance } from "../../api/billing";
import StatCard from "../ui/StatCard";
import { he } from "../../i18n/he";
import { creditsValue } from "../../utils/creditsDisplay";
import { creditsAreLow, type SessionCounts } from "../../utils/teacherDashboard";

type TeacherStatGridProps = {
  counts: SessionCounts;
  pending: number;
  wallet: WalletBalance | null;
  loading: boolean;
};

/** Quatre chiffres clés, chacun mène à l'écran où agir. */
export default function TeacherStatGrid({ counts, pending, wallet, loading }: TeacherStatGridProps) {
  const low = wallet ? creditsAreLow(wallet.total, wallet.unlimited) : false;
  return (
    <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3.5 }}>
      <Grid item xs={6} md={3}>
        <StatCard label={he.statActiveExams} value={counts.active} icon={<AssignmentOutlinedIcon />} tone="success" to="/teacher/exams" loading={loading} />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard label={he.statAwaitingPublish} value={counts.awaitingPublish} icon={<GradingIcon />} tone="warning" to="/teacher/exams" loading={loading} />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard label={he.statPendingRequests} value={pending} icon={<HowToRegOutlinedIcon />} tone="primary" to="/teacher/enrollments" loading={loading} />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard
          label={he.statAiCredits}
          value={creditsValue(wallet)}
          icon={<AutoAwesomeIcon />}
          tone={low ? "danger" : "info"}
          to="/profile"
          hint={low ? he.statAiCreditsLow : undefined}
          loading={loading && !wallet}
        />
      </Grid>
    </Grid>
  );
}
