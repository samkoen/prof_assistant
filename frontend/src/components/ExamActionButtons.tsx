import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import { api, ApiError, type Exam } from "../api/client";
import { he } from "../i18n/he";

interface ExamActionButtonsProps {
  exam: Exam;
  onChanged: () => void;
  onError: (message: string) => void;
  size?: "small" | "medium";
}

export function ExamActionButtons({ exam, onChanged, onError, size = "small" }: ExamActionButtonsProps) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<"duplicate" | "delete" | null>(null);

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

  return (
    <>
      <Button
        size={size}
        variant="outlined"
        startIcon={<ContentCopyIcon />}
        disabled={busy != null}
        onClick={duplicate}
      >
        {busy === "duplicate" ? he.loading : he.duplicateExam}
      </Button>
      <Button
        size={size}
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        disabled={busy != null}
        onClick={() => setConfirmDelete(true)}
      >
        {he.deleteExam}
      </Button>

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
}: {
  examId: number;
  size?: "small" | "medium";
  returnTo?: string;
}) {
  const to = returnTo
    ? `/teacher/exams/${examId}/edit?return=${encodeURIComponent(returnTo)}`
    : `/teacher/exams/${examId}/edit`;
  return (
    <Button size={size} variant="outlined" component={RouterLink} to={to}>
      {he.editExam}
    </Button>
  );
}
