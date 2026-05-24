import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import { he } from "../../i18n/he";
import type { DataListColumnDef } from "./types";

interface ColumnPickerDialogProps {
  open: boolean;
  onClose: () => void;
  columns: DataListColumnDef<unknown>[];
  visibleKeys: string[];
  onSave: (keys: string[]) => void;
}

export default function ColumnPickerDialog({
  open,
  onClose,
  columns,
  visibleKeys,
  onSave,
}: ColumnPickerDialogProps) {
  const toggle = (key: string) => {
    const next = visibleKeys.includes(key)
      ? visibleKeys.filter((k) => k !== key)
      : [...visibleKeys, key];
    if (next.length === 0) return;
    onSave(next);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{he.tableColumns}</DialogTitle>
      <DialogContent>
        <FormGroup>
          {columns.map((col) => (
            <FormControlLabel
              key={col.key}
              control={
                <Checkbox
                  checked={visibleKeys.includes(col.key)}
                  onChange={() => toggle(col.key)}
                  disabled={visibleKeys.length === 1 && visibleKeys.includes(col.key)}
                />
              }
              label={col.label}
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button variant="contained" onClick={onClose}>
          {he.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
