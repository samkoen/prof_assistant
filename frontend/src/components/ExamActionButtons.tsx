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
import DisabledActionTooltip from "./DisabledActionTooltip";
import { api, ApiError, type Exam } from "../api/client";
import { he } from "../i18n/he";

interface ExamActionButtonsProps {
  exam: Exam;
  onChanged: () => void;
  onError: (message: string) => void;
  size?: "small" | "medium";
  iconOnly?: boolean;
}

export function ExamActionButtons({
  exam,
  onChanged,
  onError,
  size = "small",
  iconOnly = false,
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
      {deleteBtn}

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
  disabled = false,
}: {
  examId: number;
  size?: "small" | "medium";
  returnTo?: string;
  iconOnly?: boolean;
  /** false quand le מבחן a déjà été activé (même règle que can_delete). */
  disabled?: boolean;
}) {
  const to = returnTo
    ? `/teacher/exams/${examId}/edit?return=${encodeURIComponent(returnTo)}`
    : `/teacher/exams/${examId}/edit`;

  if (iconOnly) {
    return (
      <DisabledActionTooltip
        disabled={disabled}
        disabledReason={he.examNotEditable}
        title={he.editExam}
      >
        <IconButton
          size="small"
          disabled={disabled}
          component={disabled ? "button" : RouterLink}
          to={disabled ? undefined : to}
          color={disabled ? "default" : "primary"}
          aria-label={he.editExam}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </DisabledActionTooltip>
    );
  }

  return (
    <DisabledActionTooltip
      disabled={disabled}
      disabledReason={he.examNotEditable}
      title={he.editExam}
    >
      <Button
        size={size}
        variant="outlined"
        disabled={disabled}
        component={disabled ? "button" : RouterLink}
        to={disabled ? undefined : to}
      >
        {he.editExam}
      </Button>
    </DisabledActionTooltip>
  );
}
