import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { he } from "../i18n/he";

export interface StudentFormValues {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  student_id: string;
}

interface StudentFormDialogProps {
  open: boolean;
  onClose: () => void;
  form: StudentFormValues;
  onChange: (form: StudentFormValues) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export default function StudentFormDialog({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  submitting = false,
}: StudentFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{he.newStudent}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          label={he.fullName}
          value={form.full_name}
          onChange={(e) => onChange({ ...form, full_name: e.target.value })}
          required
          fullWidth
        />
        <TextField
          label={he.email}
          type="email"
          value={form.email}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
          required
          fullWidth
        />
        <TextField
          label={he.password}
          type="password"
          value={form.password}
          onChange={(e) => onChange({ ...form, password: e.target.value })}
          required
          fullWidth
        />
        <TextField
          label={he.studentId}
          value={form.student_id}
          onChange={(e) => onChange({ ...form, student_id: e.target.value })}
          fullWidth
        />
        <TextField
          label={he.phone}
          value={form.phone}
          onChange={(e) => onChange({ ...form, phone: e.target.value })}
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          {he.cancel}
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>
          {he.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
