import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import type { CatalogForm } from "../../hooks/useTeacherCatalogs";
import { he } from "../../i18n/he";

type CreateCatalogDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (form: CatalogForm) => Promise<boolean>;
};

const EMPTY: CatalogForm = { name: "", description: "" };

/** Création d'un cours de catalogue (nom obligatoire, description facultative). */
export default function CreateCatalogDialog({ open, onClose, onCreate }: CreateCatalogDialogProps) {
  const [form, setForm] = useState<CatalogForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const ok = await onCreate(form);
    setSaving(false);
    if (!ok) return;
    setForm(EMPTY);
    onClose();
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.createCatalogCourse}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        <TextField
          label={he.subject}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          autoFocus
          placeholder="לדוגמה: מבני נתונים"
          fullWidth
        />
        <TextField
          label={he.description}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          multiline
          rows={2}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {he.cancel}
        </Button>
        <Button variant="contained" onClick={submit} disabled={!form.name.trim() || saving}>
          {saving ? he.loading : he.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
