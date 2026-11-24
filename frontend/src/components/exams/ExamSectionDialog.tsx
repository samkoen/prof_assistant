import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import type { ExamSection, ExamSectionInput } from "../../api/client";
import { he } from "../../i18n/he";
import { parseRequiredCount } from "../../utils/examSections";

type ExamSectionDialogProps = {
  open: boolean;
  /** null = nouvelle partie. */
  section: ExamSection | null;
  questionCount: number;
  busy: boolean;
  onClose: () => void;
  onSave: (input: ExamSectionInput) => void;
};

/** Création / édition d'une partie : titre, consigne et nombre de questions à traiter. */
export default function ExamSectionDialog({ open, section, questionCount, busy, onClose, onSave }: ExamSectionDialogProps) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [required, setRequired] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(section?.title ?? "");
    setInstructions(section?.instructions ?? "");
    setRequired(section?.required_count != null ? String(section.required_count) : "");
  }, [open, section]);

  const requiredCount = parseRequiredCount(required);
  const tooHigh = requiredCount != null && questionCount > 0 && requiredCount >= questionCount;
  const save = () => onSave({ title: title.trim(), instructions: instructions.trim() || null, required_count: requiredCount });

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{section ? he.examSectionEdit : he.examSectionAdd}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        <TextField label={he.examSectionTitleLabel} placeholder={he.examSectionTitlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus fullWidth required />
        <TextField label={he.examSectionInstructionsLabel} value={instructions} onChange={(e) => setInstructions(e.target.value)} multiline minRows={3} fullWidth />
        <TextField
          label={he.examSectionRequiredLabel}
          type="number"
          value={required}
          onChange={(e) => setRequired(e.target.value)}
          helperText={he.examSectionRequiredHint}
          inputProps={{ min: 1, step: 1 }}
          fullWidth
        />
        {tooHigh && <Alert severity="info">{he.examSectionRequiredTooHigh}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>{he.cancel}</Button>
        <Button variant="contained" onClick={save} disabled={busy || !title.trim()}>{he.save}</Button>
      </DialogActions>
    </Dialog>
  );
}
