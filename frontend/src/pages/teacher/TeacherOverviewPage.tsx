import { Alert, Box, Button, Grid } from "@mui/material";
import RecentExamsPanel from "../../components/teacher/RecentExamsPanel";
import TeacherOnboarding from "../../components/teacher/TeacherOnboarding";
import TeacherStatGrid from "../../components/teacher/TeacherStatGrid";
import TeacherTodoPanel from "../../components/teacher/TeacherTodoPanel";
import TeacherWelcomeBanner from "../../components/teacher/TeacherWelcomeBanner";
import { useAuth } from "../../context/AuthContext";
import { useEnrollmentReview } from "../../hooks/useEnrollmentReview";
import { useRoleCredits } from "../../hooks/useRoleCredits";
import { useTeacherDashboard } from "../../hooks/useTeacherDashboard";
import { he } from "../../i18n/he";
import { hebrewAlignRightSx } from "../../styles/hebrewAlign";
import {
  countSessions,
  dashboardHeadline,
  firstName,
  needsOnboarding,
  onboardingSteps,
} from "../../utils/teacherDashboard";

/** Accueil prof : ce qui demande une action, les chiffres clés, les derniers examens. */
export default function TeacherOverviewPage() {
  const { user } = useAuth();
  const { data, loading, failed, reload, removePending } = useTeacherDashboard();
  const { reviewing, review } = useEnrollmentReview(removePending);
  const { wallet } = useRoleCredits("teacher");

  const counts = countSessions(data.sessions);
  const pendingCount = data.pending.length;
  const progress = { catalogs: data.catalogs, offerings: data.offerings, sessions: data.sessions.length };
  const headline = loading
    ? ""
    : dashboardHeadline({ pending: pendingCount, active: counts.active, awaitingPublish: counts.awaitingPublish });

  return (
    <Box sx={hebrewAlignRightSx}>
      <TeacherWelcomeBanner name={firstName(user?.full_name ?? "")} headline={headline} />
      {failed > 0 && !loading && (
        <Alert
          severity="warning"
          sx={{ mb: 2.5 }}
          action={<Button color="inherit" size="small" onClick={reload}>{he.retry}</Button>}
        >
          {he.dashboardLoadPartial}
        </Alert>
      )}
      {!loading && needsOnboarding(progress) && <TeacherOnboarding steps={onboardingSteps(progress)} />}
      <TeacherStatGrid counts={counts} pending={pendingCount} wallet={wallet} loading={loading} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <TeacherTodoPanel pending={data.pending} sessions={data.sessions} loading={loading} reviewing={reviewing} onReview={review} />
        </Grid>
        <Grid item xs={12} md={5}>
          <RecentExamsPanel sessions={data.sessions} loading={loading} />
        </Grid>
      </Grid>
    </Box>
  );
}
