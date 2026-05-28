import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid2 as Grid,
  Typography,
} from "@mui/material";
import ListPageToolbar from "../../components/ListPageToolbar";
import { api, ApiError, offeringLabel, type CourseOffering } from "../../api/client";
import { he } from "../../i18n/he";

export default function StudentOpenCoursesPage() {
  const [openOfferings, setOpenOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const open = await api<CourseOffering[]>("/api/courses/open");
      setOpenOfferings(open);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const join = async (offering: CourseOffering) => {
    setMessage("");
    setError("");
    try {
      const res = await api<{ status: string }>("/api/enrollments/request", {
        method: "POST",
        body: JSON.stringify({ offering_id: offering.id }),
      });
      setMessage(res.status === "approved" ? he.enrollmentApproved : he.enrollmentRequestSent);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <ListPageToolbar title={he.openCourses} subtitle={he.joinCourse} />
      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : openOfferings.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={6}>
          {he.noOpenCourses}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {openOfferings.map((o) => (
            <Grid key={o.id} size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600}>
                    {offeringLabel(o)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {o.teacher_name}
                  </Typography>
                  <Button variant="outlined" onClick={() => join(o)}>
                    {he.joinCourse}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
