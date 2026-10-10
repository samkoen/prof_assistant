import { Link as RouterLink } from "react-router-dom";
import { Button } from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";
import StatusChip from "../ui/StatusChip";
import type { CourseOffering } from "../../api/client";
import { he } from "../../i18n/he";

/** Badge « N examens actifs » à côté de l'état d'inscription ; rien s'il n'y en a pas. */
export function ActiveExamsBadge({ offering, counts }: { offering: CourseOffering; counts: Record<number, number> }) {
  const n = counts[offering.id] ?? 0;
  return n > 0 ? <StatusChip label={he.studentCourseExamsBadge(n)} tone="success" /> : null;
}

/** Pied de carte : accès direct aux examens du cours. */
export function CourseExamsFooter({ offering }: { offering: CourseOffering }) {
  return (
    <Button component={RouterLink} to={`/student/courses/${offering.id}`} size="small" startIcon={<QuizIcon />}>
      {he.studentCourseOpenExams}
    </Button>
  );
}
