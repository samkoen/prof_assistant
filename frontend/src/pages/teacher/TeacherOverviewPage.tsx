import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Grid, Typography } from "@mui/material";
import HebrewCardRow from "../../components/ui/HebrewCardRow";
import PeopleIcon from "@mui/icons-material/People";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import DashboardNavCard from "../../components/ui/DashboardNavCard";
import PageHeroBanner from "../../components/ui/PageHeroBanner";
import {
  api,
  ApiError,
  enrollmentOfferingLabel,
  verifyStudentEmailBypass,
  type Enrollment,
  type StudentAccount,
} from "../../api/client";
import { he } from "../../i18n/he";
import { hebrewAlignRightSx } from "../../styles/hebrewAlign";

const navCards = [
  {
    title: he.students,
    desc: he.studentsSubtitle,
    path: "/teacher/students",
    icon: <PeopleIcon />,
    accent: "primary" as const,
  },
  {
    title: he.myCourses,
    desc: he.manageCourseStudents,
    path: "/teacher/courses",
    icon: <MenuBookIcon />,
    accent: "secondary" as const,
  },
  {
    title: he.pendingApprovals,
    desc: he.enrollmentsSubtitle,
    path: "/teacher/enrollments",
    icon: <SchoolIcon />,
    accent: "warning" as const,
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
    [pendingEnrollments.length, unverifiedStudents.length],
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
    <Box sx={hebrewAlignRightSx}>
      <PageHeroBanner
        title={he.dashboard}
        actions={
          pendingCount > 0 ? (
            <Chip
              label={`${he.pendingApprovals}: ${pendingCount}`}
              onClick={() =>
                document.getElementById("teacher-pending-requests")?.scrollIntoView({ behavior: "smooth" })
              }
              sx={{
                cursor: "pointer",
                fontWeight: 700,
                bgcolor: "rgba(255,255,255,0.25)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            />
          ) : undefined
        }
      />

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

      <Box id="teacher-pending-requests" sx={{ mb: 4, ...hebrewAlignRightSx }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {he.pendingApprovals}
        </Typography>
        {loading ? (
          <Typography color="text.secondary">{he.loading}</Typography>
        ) : pendingCount === 0 ? (
          <Typography color="text.secondary">{he.noPendingRequests}</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {unverifiedStudents.map((s) => (
              <HebrewCardRow
                key={`verify-${s.id}`}
                text={
                  <>
                    <Chip size="small" label={he.pendingEmailVerificationRequest} color="warning" sx={{ mb: 1 }} />
                    <Typography fontWeight={700}>{s.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "left" }}>
                      {s.email}
                    </Typography>
                  </>
                }
                actions={
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={verifyingId === s.id}
                    onClick={() => verifyStudent(s)}
                  >
                    {he.verifyStudentEmail}
                  </Button>
                }
              />
            ))}
            {pendingEnrollments.map((p) => (
              <HebrewCardRow
                key={`enrollment-${p.id}`}
                text={
                  <>
                    <Chip size="small" label={he.pendingEnrollmentRequest} color="warning" sx={{ mb: 1 }} />
                    <Typography fontWeight={700}>{p.student_name}</Typography>
                    <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "left" }}>
                      {p.student_email}
                    </Typography>
                    {enrollmentOfferingLabel(p) && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {enrollmentOfferingLabel(p)}
                      </Typography>
                    )}
                  </>
                }
                actions={
                  <>
                    <Button size="small" variant="contained" onClick={() => reviewEnrollment(p.id, "approved")}>
                      {he.approve}
                    </Button>
                    <Button size="small" color="error" variant="outlined" onClick={() => reviewEnrollment(p.id, "rejected")}>
                      {he.reject}
                    </Button>
                  </>
                }
              />
            ))}
          </Box>
        )}
      </Box>

      <Grid container spacing={2.5}>
        {navCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.path}>
            <DashboardNavCard
              to={card.path}
              title={card.title}
              description={card.desc}
              icon={card.icon}
              accent={card.accent}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
