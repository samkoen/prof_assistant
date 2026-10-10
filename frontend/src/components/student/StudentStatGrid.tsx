import { Grid } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import QuizIcon from "@mui/icons-material/Quiz";
import type { WalletBalance } from "../../api/billing";
import StatCard from "../ui/StatCard";
import { he } from "../../i18n/he";
import { creditsValue } from "../../utils/creditsDisplay";
import type { StudentExamCounts } from "../../utils/studentExams";
import { creditsAreLow } from "../../utils/teacherDashboard";

type StudentStatGridProps = {
  counts: StudentExamCounts;
  courses: number;
  wallet: WalletBalance | null;
  loading: boolean;
};

/** Quatre chiffres clés de l'élève, chacun mène à l'écran correspondant. */
export default function StudentStatGrid({ counts, courses, wallet, loading }: StudentStatGridProps) {
  const low = wallet ? creditsAreLow(wallet.total, wallet.unlimited) : false;
  return (
    <Grid container spacing={2} sx={{ mb: 3.5 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard label={he.studentStatToDo} value={counts.todo + counts.inProgress} icon={<QuizIcon />} tone="success" to="/student/exams" loading={loading} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard label={he.studentStatGraded} value={counts.graded} icon={<EmojiEventsOutlinedIcon />} tone="violet" to="/student/exams" loading={loading} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard label={he.studentStatCourses} value={courses} icon={<MenuBookIcon />} tone="info" to="/student/courses" loading={loading} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          label={he.statAiCredits}
          value={creditsValue(wallet)}
          icon={<AutoAwesomeIcon />}
          tone={low ? "danger" : "warning"}
          to="/profile"
          hint={low ? he.statAiCreditsLow : undefined}
          loading={loading && !wallet}
        />
      </Grid>
    </Grid>
  );
}
