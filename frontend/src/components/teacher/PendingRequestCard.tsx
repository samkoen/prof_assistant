import { Box, Typography } from "@mui/material";
import PendingEnrollmentActions, { type ReviewAction } from "../PendingEnrollmentActions";
import HebrewCardRow from "../ui/HebrewCardRow";
import { enrollmentOfferingLabel, type Enrollment } from "../../api/client";

type PendingRequestCardProps = {
  enrollment: Enrollment;
  reviewing: ReviewAction | null;
  onReview: (id: number, status: "approved" | "rejected") => void;
  /** Masquer le libellé du cours quand la carte est déjà sous un en-tête de groupe. */
  showOffering?: boolean;
};

/** Demande d'inscription : qui, pour quel cours, et approuver / rejeter sur place. */
export default function PendingRequestCard({ enrollment, reviewing, onReview, showOffering = true }: PendingRequestCardProps) {
  const offering = showOffering ? enrollmentOfferingLabel(enrollment) : null;
  return (
    <HebrewCardRow
      text={
        <Box>
          <Typography fontWeight={700}>{enrollment.student_name}</Typography>
          <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "left" }}>
            {enrollment.student_email}
          </Typography>
          {offering && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {offering}
            </Typography>
          )}
        </Box>
      }
      actions={<PendingEnrollmentActions enrollmentId={enrollment.id} reviewing={reviewing} onReview={onReview} />}
    />
  );
}
