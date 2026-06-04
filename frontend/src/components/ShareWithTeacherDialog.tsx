import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { api, ApiError } from "../api/client";
import { he } from "../i18n/he";

type ShareKind = "exam" | "catalog";

interface ShareWithTeacherDialogProps {
  open: boolean;
  kind: ShareKind;
  examId?: number;
  catalogId?: number;
  itemLabel: string;
  onClose: () => void;
  onSent: () => void;
}

export default function ShareWithTeacherDialog({
  open,
  kind,
  examId,
  catalogId,
  itemLabel,
  onClose,
  onSent,
}: ShareWithTeacherDialogProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    setError("");
    try {
      await api("/api/teacher-shares", {
        method: "POST",
        body: JSON.stringify({
          recipient_email: email.trim(),
          share_type: kind,
          exam_id: kind === "exam" ? examId : null,
          catalog_id: kind === "catalog" ? catalogId : null,
          message: message.trim() || null,
        }),
      });
      setEmail("");
      setMessage("");
      onSent();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{kind === "exam" ? he.shareExam : he.shareCatalog}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <Alert severity="info">{itemLabel}</Alert>
        <TextField
          label={he.teacherEmail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          dir="ltr"
        />
        <TextField
          label={he.shareMessageOptional}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          rows={2}
          fullWidth
        />
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button variant="contained" onClick={submit} disabled={sending || !email.trim()}>
          {sending ? he.loading : he.sendShare}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
