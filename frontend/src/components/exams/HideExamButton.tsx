import { useState } from "react";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip, Typography } from "@mui/material";
import { api, ApiError, type Exam } from "../../api/client";
import { he } from "../../i18n/he";

type Props = {
  exam: Exam;
  iconOnly?: boolean;
  size?: "small" | "medium";
  onChanged: () => void;
  onError: (message: string) => void;
};

async function saveVisibility(examId: number, hidden: boolean): Promise<void> {
  await api(`/api/exams/${examId}/student-visibility`, {
    method: "PATCH",
    body: JSON.stringify({ hidden_from_students: hidden }),
  });
}

function HideExamDialog({
  open,
  hidden,
  title,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  hidden: boolean;
  title: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{hidden ? he.showExam : he.hideExam}</DialogTitle>
      <DialogContent>
        <Typography>{hidden ? he.showExamConfirm : he.hideExamConfirm}</Typography>
        <Typography fontWeight={600} sx={{ mt: 1 }}>{title}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button variant="contained" onClick={onConfirm} disabled={busy}>
          {busy ? he.loading : hidden ? he.showExam : he.hideExam}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function HideExamButton({ exam, iconOnly = false, size = "small", onChanged, onError }: Props) {
  const hidden = Boolean(exam.hidden_from_students);
  const label = hidden ? he.showExam : he.hideExam;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await saveVisibility(exam.id, !hidden);
      setOpen(false);
      onChanged();
    } catch (error) {
      onError(error instanceof ApiError ? error.message : he.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const icon = hidden ? <VisibilityOutlinedIcon fontSize="small" /> : <VisibilityOffOutlinedIcon fontSize="small" />;
  const trigger = iconOnly ? (
    <Tooltip title={label}>
      <IconButton size="small" color={hidden ? "warning" : "default"} aria-label={label} onClick={() => setOpen(true)}>
        {icon}
      </IconButton>
    </Tooltip>
  ) : (
    <Button size={size} variant="outlined" color={hidden ? "warning" : "inherit"} startIcon={icon} onClick={() => setOpen(true)}>
      {label}
    </Button>
  );

  return (
    <>
      {trigger}
      <HideExamDialog
        open={open}
        hidden={hidden}
        title={exam.title}
        busy={busy}
        onClose={() => setOpen(false)}
        onConfirm={() => void confirm()}
      />
    </>
  );
}
