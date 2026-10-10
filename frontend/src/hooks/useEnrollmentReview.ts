import { useState } from "react";
import type { ReviewAction } from "../components/PendingEnrollmentActions";
import { api, ApiError } from "../api/client";
import { useFeedback } from "../context/FeedbackContext";
import { he } from "../i18n/he";

type ReviewStatus = "approved" | "rejected";

/** Approuver / rejeter une demande d'inscription, avec retour visuel. */
export function useEnrollmentReview(onReviewed: (id: number) => void) {
  const { showSuccess, showError } = useFeedback();
  const [reviewing, setReviewing] = useState<ReviewAction | null>(null);

  const review = async (id: number, status: ReviewStatus) => {
    setReviewing({ id, status });
    try {
      await api(`/api/enrollments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      onReviewed(id);
      showSuccess(status === "approved" ? he.approvedSuccess : he.rejectedSuccess);
    } catch (e) {
      showError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setReviewing(null);
    }
  };

  return { reviewing, review };
}
