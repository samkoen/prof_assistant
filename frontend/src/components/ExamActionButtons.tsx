import { Link as RouterLink } from "react-router-dom";
import { Button, IconButton, Tooltip } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ActionsMenu from "./ui/ActionsMenu";
import type { Exam } from "../api/client";
import { useExamManageActions } from "../hooks/useExamManageActions";
import { he } from "../i18n/he";

interface ExamActionButtonsProps {
  exam: Exam;
  onChanged: () => void;
  onError: (message: string) => void;
  onDeleted?: () => void;
  /** Depuis un קורס : retire la מטלה de ce קורס seulement. */
  offeringId?: number;
}

/** Menu « ⋮ » de gestion d'une מטלה (dupliquer, partager, PDF, masquer, supprimer). */
export function ExamActionButtons({ exam, onChanged, onError, onDeleted, offeringId }: ExamActionButtonsProps) {
  const manage = useExamManageActions(exam, { onChanged, onError, onDeleted, offeringId });
  return (
    <>
      <ActionsMenu actions={manage.actions} />
      {manage.dialogs}
    </>
  );
}

export function examEditPath(examId: number, returnTo?: string): string {
  return returnTo ? `/teacher/exams/${examId}/edit?return=${encodeURIComponent(returnTo)}` : `/teacher/exams/${examId}/edit`;
}

export function ExamEditLink({
  examId,
  size = "small",
  returnTo,
  iconOnly = false,
  viewOnly = false,
}: {
  examId: number;
  size?: "small" | "medium";
  returnTo?: string;
  iconOnly?: boolean;
  /** מבחן déjà activé — צפייה (lecture seule) au lieu de עריכה. */
  viewOnly?: boolean;
}) {
  const to = examEditPath(examId, returnTo);
  const label = viewOnly ? he.viewExam : he.editExam;
  const ActionIcon = viewOnly ? VisibilityOutlinedIcon : EditOutlinedIcon;
  if (iconOnly) {
    return (
      <Tooltip title={label}>
        <IconButton component={RouterLink} to={to} size="small" color="primary" aria-label={label}>
          <ActionIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }
  return (
    <Button size={size} variant="outlined" component={RouterLink} to={to} startIcon={<ActionIcon />}>
      {label}
    </Button>
  );
}
