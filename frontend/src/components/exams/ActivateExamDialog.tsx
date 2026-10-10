import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from "@mui/material";
import DisabledActionTooltip from "../DisabledActionTooltip";
import ExamActivateTimingFields from "../ExamActivateTimingFields";
import { offeringLabel, type CourseOffering, type Exam } from "../../api/client";
import { he } from "../../i18n/he";
import type { ExamTimingForm } from "../../utils/examActivateTiming";

type ActivateExamDialogProps = {
  open: boolean;
  exam: Exam | null;
  offerings: CourseOffering[];
  offeringId: string;
  timing: ExamTimingForm;
  onOfferingChange: (id: string) => void;
  onTimingChange: (value: ExamTimingForm) => void;
  onClose: () => void;
  onActivate: () => void;
};

function OfferingSelect({ offerings, offeringId, onChange }: {
  offerings: CourseOffering[];
  offeringId: string;
  onChange: (id: string) => void;
}) {
  return (
    <TextField select fullWidth label={he.myCourses} value={offeringId} onChange={(e) => onChange(e.target.value)}>
      {offerings.map((o) => (
        <MenuItem key={o.id} value={String(o.id)}>
          {offeringLabel(o)}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default function ActivateExamDialog(props: ActivateExamDialogProps) {
  const { open, exam, offerings, offeringId, timing, onOfferingChange, onTimingChange, onClose, onActivate } = props;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.activateExam}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {exam && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {exam.title}
          </Typography>
        )}
        <OfferingSelect offerings={offerings} offeringId={offeringId} onChange={onOfferingChange} />
        <ExamActivateTimingFields value={timing} onChange={onTimingChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <DisabledActionTooltip disabled={!offeringId} disabledReason={!offeringId ? he.selectOfferingToActivate : undefined}>
          <Button variant="contained" onClick={onActivate}>
            {he.activateExam}
          </Button>
        </DisabledActionTooltip>
      </DialogActions>
    </Dialog>
  );
}
