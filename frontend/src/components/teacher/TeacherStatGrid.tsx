import { Grid } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GradingIcon from "@mui/icons-material/Grading";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import QuizIcon from "@mui/icons-material/Quiz";
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
    <Grid container spacing={2} sx={{ mb: 3.5 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard label={he.statActiveExams} value={counts.active} icon={<QuizIcon />} tone="success" to="/teacher/exams" loading={loading} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard label={he.statAwaitingPublish} value={counts.awaitingPublish} icon={<GradingIcon />} tone="warning" to="/teacher/exams" loading={loading} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard label={he.statPendingRequests} value={pending} icon={<HowToRegOutlinedIcon />} tone="violet" to="/teacher/enrollments" loading={loading} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
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
