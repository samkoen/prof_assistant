import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import type { Question } from "../../api/client";
import { he } from "../../i18n/he";

type DeleteQuestionDialogProps = {
  question: Question | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteQuestionDialog({ question, deleting, onClose, onConfirm }: DeleteQuestionDialogProps) {
  return (
    <Dialog open={Boolean(question)} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{he.deleteQuestion}</DialogTitle>
      <DialogContent>
        <Typography>{he.deleteQuestionConfirm}</Typography>
        {question && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {question.text}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={deleting}>
          {deleting ? he.loading : he.deleteQuestion}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
