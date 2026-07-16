import LoadingButton from "./ui/LoadingButton";
import { he } from "../i18n/he";

export type ReviewAction = { id: number; status: "approved" | "rejected" };

type PendingEnrollmentActionsProps = {
  enrollmentId: number;
  reviewing: ReviewAction | null;
  onReview: (id: number, status: "approved" | "rejected") => void;
};

export default function PendingEnrollmentActions({
  enrollmentId,
  reviewing,
  onReview,
}: PendingEnrollmentActionsProps) {
  const busy = reviewing !== null;
  const busyHere = reviewing?.id === enrollmentId;

  return (
    <>
      <LoadingButton
        size="small"
        variant="contained"
        loading={busyHere && reviewing?.status === "approved"}
        disabled={busy && !busyHere}
        onClick={() => onReview(enrollmentId, "approved")}
      >
        {he.approve}
      </LoadingButton>
      <LoadingButton
        size="small"
        color="error"
        variant="outlined"
        loading={busyHere && reviewing?.status === "rejected"}
        disabled={busy && !busyHere}
        onClick={() => onReview(enrollmentId, "rejected")}
      >
        {he.reject}
      </LoadingButton>
    </>
  );
}
