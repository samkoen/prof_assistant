import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, IconButton, Tooltip } from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";
import { OfferingCardGrid } from "../../components/CourseCardGrid/CourseCardGrid";
import ListPageToolbar from "../../components/ListPageToolbar";
import { api, ApiError, type CourseOffering, type ExamSession } from "../../api/client";
import { he } from "../../i18n/he";

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [activeByOffering, setActiveByOffering] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mine, sessions] = await Promise.all([
        api<CourseOffering[]>("/api/courses/mine"),
        api<ExamSession[]>("/api/exams/sessions/mine"),
      ]);
      setOfferings(mine);
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

  const goToExams = (offeringId: number) => navigate(`/student/courses/${offeringId}`);

  return (
    <Box sx={{ width: "100%" }}>
      <ListPageToolbar title={he.myCourses} subtitle={he.doubleClickCourseHint} />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <OfferingCardGrid
          offerings={offerings}
          onCardDoubleClick={(o) => goToExams(o.id)}
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
    </Box>
  );
}
