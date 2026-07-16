import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Grid, Typography } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import PendingEnrollmentActions, {
  type ReviewAction,
} from "../../components/PendingEnrollmentActions";
import DashboardNavCard from "../../components/ui/DashboardNavCard";
import EmptyState from "../../components/ui/EmptyState";
import HebrewCardRow from "../../components/ui/HebrewCardRow";
import PageHeroBanner from "../../components/ui/PageHeroBanner";
import { useFeedback } from "../../context/FeedbackContext";
import { api, ApiError, enrollmentOfferingLabel, type Enrollment } from "../../api/client";
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

function PendingRequestCard({
  enrollment,
  reviewing,
  onReview,
}: {
  enrollment: Enrollment;
  reviewing: ReviewAction | null;
  onReview: (id: number, status: "approved" | "rejected") => void;
}) {
  const offering = enrollmentOfferingLabel(enrollment);
  return (
    <HebrewCardRow
      text={
        <>
          <Chip size="small" label={he.pendingEnrollmentRequest} color="warning" sx={{ mb: 1 }} />
          <Typography fontWeight={700}>{enrollment.student_name}</Typography>
          <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "left" }}>
            {enrollment.student_email}
          </Typography>
          {offering && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {offering}
            </Typography>
          )}
        </>
      }
      actions={
        <PendingEnrollmentActions
          enrollmentId={enrollment.id}
          reviewing={reviewing}
          onReview={onReview}
        />
      }
    />
  );
}

export default function TeacherOverviewPage() {
  const { showSuccess, showError } = useFeedback();
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState<ReviewAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPendingEnrollments(await api<Enrollment[]>("/api/enrollments/pending"));
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
    setReviewing({ id: enrollmentId, status });
    try {
      await api(`/api/enrollments/${enrollmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setPendingEnrollments((rows) => rows.filter((r) => r.id !== enrollmentId));
      showSuccess(status === "approved" ? he.approvedSuccess : he.rejectedSuccess);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : he.errorGeneric;
      setError(msg);
      showError(msg);
    } finally {
      setReviewing(null);
    }
  };

  const pendingCount = pendingEnrollments.length;

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
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
          action={
            <Button color="inherit" size="small" onClick={load}>
              {he.retry}
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Box id="teacher-pending-requests" sx={{ mb: 4, ...hebrewAlignRightSx }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {he.pendingApprovals}
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={36} />
          </Box>
        ) : pendingCount === 0 ? (
          <EmptyState
            title={he.noPendingRequests}
            description={he.noPendingRequestsHint}
            icon={<HowToRegOutlinedIcon />}
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {pendingEnrollments.map((p) => (
              <PendingRequestCard
                key={p.id}
                enrollment={p}
                reviewing={reviewing}
                onReview={reviewEnrollment}
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
