import { useState } from "react";
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import type { StudentAccount } from "../../api/client";
import { he } from "../../i18n/he";

type AddStudentDialogProps = {
  open: boolean;
  candidates: StudentAccount[];
  onClose: () => void;
  onAdd: (studentId: number) => Promise<boolean>;
};

const label = (s: StudentAccount) => `${s.full_name} (${s.email})`;

/** Ajout d'un étudiant au groupe, avec recherche dans la liste (nom ou e-mail). */
export default function AddStudentDialog({ open, candidates, onClose, onAdd }: AddStudentDialogProps) {
  const [selected, setSelected] = useState<StudentAccount | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    const ok = await onAdd(selected.id);
    setSaving(false);
    if (ok) {
      setSelected(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.addStudentToCourse}</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        {candidates.length === 0 ? (
          <Typography color="text.secondary">{he.noStudents}</Typography>
        ) : (
          <Autocomplete
            options={candidates}
            value={selected}
            onChange={(_, value) => setSelected(value)}
            getOptionLabel={label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText={he.noStudents}
            renderInput={(params) => <TextField {...params} label={he.selectStudent} autoFocus />}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {he.cancel}
        </Button>
        <Button variant="contained" onClick={submit} disabled={!selected || saving}>
          {saving ? he.loading : he.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
