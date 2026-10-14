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
import { api, ApiError } from "../../api/client";
import { he } from "../../i18n/he";

type CreatePersonalSubjectDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
};

/** Nom et description d'une matière que l'élève possède seul. */
export default function CreatePersonalSubjectDialog({ open, onClose, onCreated }: CreatePersonalSubjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setName("");
    setDescription("");
    setError("");
    onClose();
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await api("/api/student/subjects", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      await onCreated();
      close();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.createPersonalSubject}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField label={he.personalSubjectName} value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
        <TextField label={he.description} value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={2} fullWidth />
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>{he.cancel}</Button>
        <Button variant="contained" onClick={submit} disabled={saving || !name.trim()}>
          {saving ? he.loading : he.createPersonalSubject}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
