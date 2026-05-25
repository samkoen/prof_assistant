import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid2 as Grid,
  Typography,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import QuizIcon from "@mui/icons-material/Quiz";
import SchoolIcon from "@mui/icons-material/School";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import { api, type CourseOffering, type ExamSession } from "../../api/client";
import { he } from "../../i18n/he";

export default function StudentOverviewPage() {
  const [courses, setCourses] = useState(0);
  const [activeExams, setActiveExams] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [mine, sessions] = await Promise.all([
          api<CourseOffering[]>("/api/courses/mine"),
          api<ExamSession[]>("/api/exams/sessions/mine"),
        ]);
        setCourses(mine.length);
        setActiveExams(sessions.filter((s) => s.status === "active").length);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {he.dashboard}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {he.welcome}
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <MenuBookIcon color="primary" sx={{ mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                {he.myCourses}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {courses} {he.coursesCount}
              </Typography>
              <Button component={RouterLink} to="/student/courses" variant="contained" fullWidth>
                {he.myCourses}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            sx={{
              height: "100%",
              border: activeExams > 0 ? "2px solid" : undefined,
              borderColor: activeExams > 0 ? "success.light" : undefined,
            }}
          >
            <CardContent>
              <QuizIcon color="success" sx={{ mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                {he.exams}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {activeExams > 0
                  ? `${activeExams} ${he.activeExams}`
                  : he.noActiveExamsHint}
              </Typography>
              <DisabledActionTooltip
                disabled={activeExams === 0}
                disabledReason={activeExams === 0 ? he.noActiveExamsToView : undefined}
              >
                <Button
                  component={RouterLink}
                  to="/student/exams"
                  variant="contained"
                  color="success"
                  fullWidth
                >
                  {he.startExam}
                </Button>
              </DisabledActionTooltip>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <SchoolIcon sx={{ mb: 1, color: "text.secondary" }} />
              <Typography variant="h6" fontWeight={600}>
                {he.openCourses}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {he.joinCourse}
              </Typography>
              <Button component={RouterLink} to="/student/open-courses" variant="outlined" fullWidth>
                {he.openCourses}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
