import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DisabledActionTooltip from "./DisabledActionTooltip";
import ExamPdfDownloadButton from "./ExamPdfDownloadButton";
import { api, ApiError, type Exam } from "../api/client";
import { he } from "../i18n/he";

interface ExamActionButtonsProps {
  exam: Exam;
  onChanged: () => void;
  onError: (message: string) => void;
  size?: "small" | "medium";
  iconOnly?: boolean;
  /** Masquer les actions indisponibles (ex. supprimer si examen activé). */
  hideInactive?: boolean;
}

export function ExamActionButtons({
  exam,
  onChanged,
  onError,
  size = "small",
  iconOnly = false,
  hideInactive = false,
}: ExamActionButtonsProps) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<"duplicate" | "delete" | null>(null);
  const canDelete = exam.can_delete !== false;

  const duplicate = async () => {
    setBusy("duplicate");
    try {
      const copy = await api<Exam>(`/api/exams/${exam.id}/duplicate`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      navigate(`/teacher/exams/${copy.id}/edit?return=${encodeURIComponent(window.location.pathname)}`);
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await api(`/api/exams/${exam.id}`, { method: "DELETE" });
      setConfirmDelete(false);
      onChanged();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setBusy(null);
    }
  };

  const deleteBtn = iconOnly ? (
    <DisabledActionTooltip
      disabled={busy != null || !canDelete}
      disabledReason={!canDelete ? he.cannotDeleteExamActivated : undefined}
      title={busy === "delete" ? he.loading : he.deleteExam}
    >
      <IconButton
        size="small"
        color="error"
        aria-label={he.deleteExam}
        onClick={() => setConfirmDelete(true)}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </DisabledActionTooltip>
  ) : (
    <DisabledActionTooltip
      disabled={busy != null || !canDelete}
      disabledReason={!canDelete ? he.cannotDeleteExamActivated : undefined}
      title={busy === "delete" ? he.loading : he.deleteExam}
    >
      <Button
        size={size}
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={() => setConfirmDelete(true)}
      >
        {he.deleteExam}
      </Button>
    </DisabledActionTooltip>
  );

  const duplicateBtn = iconOnly ? (
    <Tooltip title={busy === "duplicate" ? he.loading : he.duplicateExam}>
      <span>
        <IconButton
          size="small"
          aria-label={he.duplicateExam}
          disabled={busy != null}
          onClick={duplicate}
        >
          {busy === "duplicate" ? (
            <CircularProgress size={18} />
          ) : (
            <ContentCopyIcon fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  ) : (
    <Button
      size={size}
      variant="outlined"
      startIcon={<ContentCopyIcon />}
      disabled={busy != null}
      onClick={duplicate}
    >
      {busy === "duplicate" ? he.loading : he.duplicateExam}
    </Button>
  );

  return (
    <>
      {duplicateBtn}
      <ExamPdfDownloadButton exam={exam} onError={onError} iconOnly={iconOnly} />
      {(!hideInactive || canDelete) && deleteBtn}

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} fullWidth maxWidth="xs">
        <DialogTitle>{he.deleteExam}</DialogTitle>
        <DialogContent>
          <Typography>{he.deleteExamConfirm}</Typography>
          <Typography fontWeight={600} sx={{ mt: 1 }}>
            {exam.title}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>{he.cancel}</Button>
          <Button variant="contained" color="error" onClick={remove} disabled={busy === "delete"}>
            {busy === "delete" ? he.loading : he.deleteExam}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
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
  /** מבחן déjà activé — icône צפייה (lecture seule) au lieu de עריכה. */
  viewOnly?: boolean;
}) {
  const to = returnTo
    ? `/teacher/exams/${examId}/edit?return=${encodeURIComponent(returnTo)}`
    : `/teacher/exams/${examId}/edit`;
  const label = viewOnly ? he.viewExam : he.editExam;
  const ActionIcon = viewOnly ? VisibilityOutlinedIcon : EditOutlinedIcon;

  if (iconOnly) {
    return (
      <Tooltip title={label}>
        <IconButton
          component={RouterLink}
          to={to}
          size="small"
          color="primary"
          aria-label={label}
        >
          <ActionIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      size={size}
      variant="outlined"
      component={RouterLink}
      to={to}
      startIcon={<ActionIcon />}
    >
      {label}
    </Button>
  );
}
