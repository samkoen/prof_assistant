import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Grid2 as Grid } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import QuizIcon from "@mui/icons-material/Quiz";
import SchoolIcon from "@mui/icons-material/School";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import HighlightCard from "../../components/ui/HighlightCard";
import PageHeroBanner from "../../components/ui/PageHeroBanner";
import { api, ApiError, type StudentCoursesBoard } from "../../api/client";
import { he } from "../../i18n/he";

export default function StudentOverviewPage() {
  const [courses, setCourses] = useState(0);
  const [activeExams, setActiveExams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const board = await api<StudentCoursesBoard>("/api/courses/student-board");
      setCourses(board.offerings.length);
      setActiveExams(
        Object.values(board.active_exam_counts).reduce((sum, count) => sum + count, 0),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={280}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeroBanner title={he.dashboard} />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5 }}
          action={
            <Button color="inherit" size="small" onClick={load}>
              {he.retry}
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <HighlightCard
            accent="primary"
            icon={<MenuBookIcon />}
            title={he.myCourses}
            description={`${courses} ${he.coursesCount}`}
            footer={
              <Button component={RouterLink} to="/student/courses" variant="contained" fullWidth>
                {he.myCourses}
              </Button>
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <HighlightCard
            accent="success"
            highlighted={activeExams > 0}
            icon={<QuizIcon />}
            title={he.exams}
            description={activeExams > 0 ? `${activeExams} ${he.activeExams}` : he.noActiveExamsHint}
            footer={
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
                  disabled={activeExams === 0}
                >
                  {he.startExam}
                </Button>
              </DisabledActionTooltip>
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <HighlightCard
            accent="secondary"
            icon={<SchoolIcon />}
            title={he.joinByTeacherTitle}
            description={he.joinByTeacherSubtitle}
            footer={
              <Button component={RouterLink} to="/student/join-course" variant="outlined" fullWidth>
                {he.joinByTeacherTitle}
              </Button>
            }
          />
        </Grid>
      </Grid>
    </Box>
  );
}
