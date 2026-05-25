import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import {
  api,
  ApiError,
  enrollmentOfferingLabel,
  verifyStudentEmailBypass,
  type Enrollment,
  type StudentAccount,
} from "../../api/client";
import { he } from "../../i18n/he";

const cards = [
  {
    title: he.students,
    desc: he.studentsSubtitle,
    path: "/teacher/students",
    icon: <PeopleIcon fontSize="large" color="primary" />,
  },
  {
    title: he.myCourses,
    desc: he.manageCourseStudents,
    path: "/teacher/courses",
    icon: <MenuBookIcon fontSize="large" color="secondary" />,
  },
  {
    title: he.pendingApprovals,
    desc: he.enrollmentsSubtitle,
    path: "/teacher/enrollments",
    icon: <SchoolIcon fontSize="large" color="warning" />,
  },
];

export default function TeacherOverviewPage() {
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([]);
  const [unverifiedStudents, setUnverifiedStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const pendingCount = useMemo(
    () => pendingEnrollments.length + unverifiedStudents.length,
    [pendingEnrollments.length, unverifiedStudents.length]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [enrollments, students] = await Promise.all([
        api<Enrollment[]>("/api/enrollments/pending"),
        api<StudentAccount[]>("/api/students"),
      ]);
      setPendingEnrollments(enrollments);
      setUnverifiedStudents(students.filter((s) => !s.email_verified));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reviewEnrollment = async (enrollmentId: number, status: "approved" | "rejected") => {
    setError("");
    setSuccess("");
    try {
      await api(`/api/enrollments/${enrollmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const verifyStudent = async (student: StudentAccount) => {
    setVerifyingId(student.id);
    setError("");
    setSuccess("");
    try {
      await verifyStudentEmailBypass(student.id);
      setSuccess(he.verifyStudentEmailSuccess);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {he.dashboard}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {he.welcome}
      </Typography>

      {pendingCount > 0 && (
        <Box sx={{ mb: 3 }}>
          <Chip
            label={`${he.pendingApprovals}: ${pendingCount}`}
            color="warning"
            onClick={() => {
              document.getElementById("teacher-pending-requests")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            sx={{ cursor: "pointer" }}
          />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Box id="teacher-pending-requests" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {he.pendingApprovals}
        </Typography>

        {loading ? (
          <Typography color="text.secondary">{he.loading}</Typography>
        ) : pendingCount === 0 ? (
          <Typography color="text.secondary">{he.noPendingRequests}</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {unverifiedStudents.map((s) => (
              <Card key={`verify-${s.id}`}>
                <CardContent
                  sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
                >
                  <Box flex={1} minWidth={200}>
                    <Chip
                      size="small"
                      label={he.pendingEmailVerificationRequest}
                      color="warning"
                      sx={{ mb: 0.5 }}
                    />
                    <Typography fontWeight={600}>{s.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.email}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={verifyingId === s.id}
                    onClick={() => verifyStudent(s)}
                  >
                    {he.verifyStudentEmail}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {pendingEnrollments.map((p) => {
              const courseLabel = enrollmentOfferingLabel(p);
              return (
                <Card key={`enrollment-${p.id}`}>
                  <CardContent
                    sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
                  >
                    <Box flex={1} minWidth={200}>
                      <Chip
                        size="small"
                        label={he.pendingEnrollmentRequest}
                        color="warning"
                        sx={{ mb: 0.5 }}
                      />
                      <Typography fontWeight={600}>{p.student_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {p.student_email}
                      </Typography>
                      {courseLabel && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {courseLabel}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => reviewEnrollment(p.id, "approved")}
                    >
                      {he.approve}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => reviewEnrollment(p.id, "rejected")}
                    >
                      {he.reject}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.path}>
            <Card
              component={Link}
              to={card.path}
              sx={{
                textDecoration: "none",
                height: "100%",
                "&:hover": { boxShadow: 4 },
              }}
            >
              <CardContent>
                <Box mb={1}>{card.icon}</Box>
                <Typography variant="h6" fontWeight={600} color="text.primary">
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
