import { IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import GradingIcon from "@mui/icons-material/Grading";
import PendingEnrollmentActions, { type ReviewAction } from "../PendingEnrollmentActions";
import type { Enrollment } from "../../api/client";
import { he } from "../../i18n/he";

type CourseStudentRowActionsProps = {
  enrollment: Enrollment;
  reviewing: ReviewAction | null;
  onReview: (id: number, status: "approved" | "rejected") => void;
  onShowGrades: (enrollment: Enrollment) => void;
  onRemove: (enrollment: Enrollment) => void;
};

/** Étudiant approuvé : notes + retrait. Demande en attente : approuver / rejeter directement. */
export default function CourseStudentRowActions(props: CourseStudentRowActionsProps) {
  const { enrollment, reviewing, onReview, onShowGrades, onRemove } = props;
  if (enrollment.status === "pending") {
    return <PendingEnrollmentActions enrollmentId={enrollment.id} reviewing={reviewing} onReview={onReview} />;
  }
  if (enrollment.status !== "approved") return null;
  return (
    <>
      <Tooltip title={he.viewStudentGrades}>
        <IconButton size="small" color="primary" aria-label={he.viewStudentGrades} onClick={() => onShowGrades(enrollment)}>
          <GradingIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={he.removeFromCourse}>
        <IconButton size="small" color="error" aria-label={he.removeFromCourse} onClick={() => onRemove(enrollment)}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </>
  );
}
