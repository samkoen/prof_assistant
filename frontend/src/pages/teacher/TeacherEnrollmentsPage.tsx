import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import ListPageToolbar from "../../components/ListPageToolbar";
import PendingEnrollmentActions, {
  type ReviewAction,
} from "../../components/PendingEnrollmentActions";
import EmptyState from "../../components/ui/EmptyState";
import HebrewCardRow from "../../components/ui/HebrewCardRow";
import { useFeedback } from "../../context/FeedbackContext";
import { hebrewAlignRightSx } from "../../styles/hebrewAlign";
import { api, ApiError, enrollmentOfferingLabel, type Enrollment } from "../../api/client";
import { he } from "../../i18n/he";

export default function TeacherEnrollmentsPage() {
  const { showSuccess, showError } = useFeedback();
  const [pending, setPending] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState<ReviewAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPending(await api<Enrollment[]>("/api/enrollments/pending"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (enrollmentId: number, status: "approved" | "rejected") => {
    setReviewing({ id: enrollmentId, status });
    try {
      await api(`/api/enrollments/${enrollmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setPending((rows) => rows.filter((r) => r.id !== enrollmentId));
      showSuccess(status === "approved" ? he.approvedSuccess : he.rejectedSuccess);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : he.errorGeneric;
      setError(msg);
      showError(msg);
    } finally {
      setReviewing(null);
    }
  };

  return (
    <Box sx={hebrewAlignRightSx}>
      <ListPageToolbar title={he.pendingApprovals} subtitle={he.enrollmentsSubtitle} />

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

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : pending.length === 0 ? (
        <EmptyState
          title={he.noPendingRequests}
          description={he.noPendingRequestsHint}
          icon={<HowToRegOutlinedIcon />}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {pending.map((p) => {
            const courseLabel = enrollmentOfferingLabel(p);
            return (
              <HebrewCardRow
                key={p.id}
                text={
                  <>
                    <Typography fontWeight={600}>{p.student_name}</Typography>
                    <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "left" }}>
                      {p.student_email}
                    </Typography>
                    {courseLabel && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {courseLabel}
                      </Typography>
                    )}
                  </>
                }
                actions={
                  <PendingEnrollmentActions
                    enrollmentId={p.id}
                    reviewing={reviewing}
                    onReview={review}
                  />
                }
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
}
