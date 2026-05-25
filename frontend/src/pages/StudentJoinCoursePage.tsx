import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import { api, ApiError, semesterLabel, type JoinPreview } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { authPathWithJoin } from "../utils/joinCourse";
import { he } from "../i18n/he";

export default function StudentJoinCoursePage() {
  const { offeringId } = useParams<{ offeringId: string }>();
  const id = Number(offeringId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<JoinPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      setPreview(await api<JoinPreview>(`/api/courses/${id}/join-preview`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const join = async () => {
    setJoining(true);
    setError("");
    setSuccess("");
    try {
      const res = await api<{ status: string }>("/api/enrollments/request", {
        method: "POST",
        body: JSON.stringify({ offering_id: id }),
      });
      setSuccess(res.status === "approved" ? he.enrollmentApproved : he.enrollmentRequestSent);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );
  }

  if (!preview) {
    return (
      <Box maxWidth={520} mx="auto" mt={6} px={2}>
        <Alert severity="error">{error || he.errorGeneric}</Alert>
      </Box>
    );
  }

  const offeringSummary = `${preview.catalog_name} — ${preview.group_name} (${preview.academic_year}, ${semesterLabel(preview.semester)})`;

  return (
    <Box maxWidth={520} mx="auto" mt={6} px={2} dir="rtl">
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {he.joinCourse}
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {preview.catalog_name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {offeringSummary}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {he.teacher}: {preview.teacher_name}
          </Typography>
          {preview.description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {preview.description}
            </Typography>
          )}
          {!preview.is_open_enrollment && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {he.courseEnrollmentClosed}
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {!user && preview.is_open_enrollment && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" component={RouterLink} to={authPathWithJoin("login", id)}>
            {he.login}
          </Button>
          <Button variant="outlined" component={RouterLink} to={authPathWithJoin("register", id)}>
            {he.register}
          </Button>
        </Box>
      )}

      {user && user.role !== "student" && (
        <Alert severity="info">{he.joinCourseStudentsOnly}</Alert>
      )}

      {user?.role === "student" && preview.already_enrolled && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            {preview.enrollment_status === "approved"
              ? he.alreadyInCourse
              : he.enrollmentRequestSent}
          </Alert>
          {preview.enrollment_status === "approved" && (
            <Button variant="contained" onClick={() => navigate(`/student/courses/${id}`)}>
              {he.viewCourseExams}
            </Button>
          )}
        </Box>
      )}

      {user?.role === "student" &&
        preview.is_open_enrollment &&
        !preview.already_enrolled && (
          <Button variant="contained" onClick={join} disabled={joining}>
            {joining ? he.loading : he.joinCourse}
          </Button>
        )}
    </Box>
  );
}
