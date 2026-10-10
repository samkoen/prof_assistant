import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Grid } from "@mui/material";
import StudentCoursesPanel from "../../components/student/StudentCoursesPanel";
import StudentStatGrid from "../../components/student/StudentStatGrid";
import StudentUpNextPanel from "../../components/student/StudentUpNextPanel";
import StudentWelcomeBanner from "../../components/student/StudentWelcomeBanner";
import { useAuth } from "../../context/AuthContext";
import { useRoleCredits } from "../../hooks/useRoleCredits";
import { useStudentCourses } from "../../hooks/useStudentCourses";
import { useStudentSessions } from "../../hooks/useStudentSessions";
import { he } from "../../i18n/he";
import { hebrewAlignRightSx } from "../../styles/hebrewAlign";
import { nextExam, studentHeadline } from "../../utils/studentExams";
import { firstName } from "../../utils/teacherDashboard";

/** Accueil élève : quoi faire maintenant, chiffres clés et accès aux cours. */
export default function StudentOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const exams = useStudentSessions();
  const courses = useStudentCourses();
  const { wallet } = useRoleCredits("student");
  const loading = exams.loading || courses.loading;
  const failed = Boolean(exams.error || courses.error);
  const retry = () => void Promise.all([exams.reload(), courses.reload()]);

  return (
    <Box sx={hebrewAlignRightSx}>
      <StudentWelcomeBanner
        name={firstName(user?.full_name ?? "")}
        headline={loading ? "" : studentHeadline(exams.counts)}
        next={nextExam(exams.sessions)}
      />
      {failed && !loading && (
        <Alert severity="warning" sx={{ mb: 2.5 }} action={<Button color="inherit" size="small" onClick={retry}>{he.retry}</Button>}>
          {he.dashboardLoadPartial}
        </Alert>
      )}
      <StudentStatGrid counts={exams.counts} courses={courses.offerings.length} wallet={wallet} loading={loading} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <StudentUpNextPanel pending={exams.pending} loading={exams.loading} onOpen={(id) => navigate(`/student/exams/${id}`)} />
        </Grid>
        <Grid item xs={12} md={5}>
          <StudentCoursesPanel offerings={courses.offerings} activeCounts={courses.active_exam_counts} loading={courses.loading} />
        </Grid>
      </Grid>
    </Box>
  );
}
