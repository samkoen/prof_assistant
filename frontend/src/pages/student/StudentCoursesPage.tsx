import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import { OfferingCardGrid } from "../../components/CourseCardGrid/CourseCardGrid";
import ListPageToolbar from "../../components/ListPageToolbar";
import { api, ApiError, type CourseOffering, type ExamSession } from "../../api/client";
import { he } from "../../i18n/he";

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [pendingOfferings, setPendingOfferings] = useState<CourseOffering[]>([]);
  const [activeByOffering, setActiveByOffering] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mine, pending, sessions] = await Promise.all([
        api<CourseOffering[]>("/api/courses/mine"),
        api<CourseOffering[]>("/api/courses/mine/pending"),
        api<ExamSession[]>("/api/exams/sessions/mine"),
      ]);
      setOfferings(mine);
      setPendingOfferings(pending);
      const counts: Record<number, number> = {};
      for (const s of sessions) {
        if (s.status === "active") {
          counts[s.offering_id] = (counts[s.offering_id] ?? 0) + 1;
        }
      }
      setActiveByOffering(counts);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (pendingOfferings.length === 0) return;
    const t = window.setInterval(load, 15000);
    return () => window.clearInterval(t);
  }, [load, pendingOfferings.length]);

  const goToExams = (offering: CourseOffering) => {
    navigate(`/student/courses/${offering.id}`);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <ListPageToolbar title={he.myCourses} subtitle={he.doubleClickCourseHint} />
      <Box sx={{ mb: 2 }}>
        <Button
          component={RouterLink}
          to="/student/join-course"
          variant="outlined"
          startIcon={<SchoolIcon />}
          size="small"
        >
          {he.joinByTeacherTitle}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : offerings.length === 0 && pendingOfferings.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {he.noCoursesJoinHint}
          </Typography>
          <Button component={RouterLink} to="/student/join-course" variant="contained" startIcon={<SchoolIcon />}>
            {he.browseOpenCourses}
          </Button>
        </Box>
      ) : (
        <>
          {pendingOfferings.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                {he.enrollmentPendingApproval}
              </Typography>
              <OfferingCardGrid offerings={pendingOfferings} />
            </Box>
          )}
          {offerings.length > 0 && (
            <OfferingCardGrid
              offerings={offerings}
              onCardDoubleClick={(o) => goToExams(o)}
              renderActions={(o) => (
                <>
                  {(activeByOffering[o.id] ?? 0) > 0 && (
                    <Chip
                      size="small"
                      color="success"
                      label={`${activeByOffering[o.id]} ${he.exams}`}
                      sx={{ height: 24, fontSize: "0.7rem" }}
                    />
                  )}
                  <Tooltip title={he.viewCourseExams}>
                    <IconButton
                      component={RouterLink}
                      to={`/student/courses/${o.id}`}
                      size="small"
                      sx={{ color: "primary.main" }}
                    >
                      <QuizIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            />
          )}
        </>
      )}
    </Box>
  );
}
