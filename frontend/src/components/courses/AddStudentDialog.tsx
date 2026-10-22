import { useState } from "react";
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, ThemeProvider, Typography } from "@mui/material";
import type { StudentAccount } from "../../api/client";
import { he } from "../../i18n/he";
import { ltrTheme } from "../../theme";

type AddStudentDialogProps = {
  open: boolean;
  candidates: StudentAccount[];
  onClose: () => void;
  onAdd: (studentId: number) => Promise<boolean>;
};

const label = (s: StudentAccount) => `${s.full_name} (${s.email})`;

function StudentPicker({
  candidates,
  selected,
  onSelect,
}: {
  candidates: StudentAccount[];
  selected: StudentAccount | null;
  onSelect: (student: StudentAccount | null) => void;
}) {
  return (
    <ThemeProvider theme={ltrTheme}>
      <Box dir="rtl">
        <Autocomplete
          fullWidth
          openOnFocus
          disablePortal
          options={candidates}
          value={selected}
          onChange={(_, value) => onSelect(value)}
          getOptionLabel={label}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          noOptionsText={he.noStudents}
          slotProps={{ popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 1 } }, listbox: { sx: { direction: "rtl", textAlign: "right" } } }}
          renderInput={(params) => <TextField {...params} label={he.selectStudent} autoFocus />}
        />
      </Box>
    </ThemeProvider>
  );
}

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
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      dir="rtl"
      slotProps={{ paper: { sx: { overflow: "visible !important" } } }}
    >
      <DialogTitle>{he.addStudentToCourse}</DialogTitle>
      <DialogContent sx={{ overflow: "visible", overflowY: "visible", pt: "8px !important" }}>
        {candidates.length === 0 ? (
          <Typography color="text.secondary">{he.noStudents}</Typography>
        ) : (
          <StudentPicker candidates={candidates} selected={selected} onSelect={setSelected} />
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
