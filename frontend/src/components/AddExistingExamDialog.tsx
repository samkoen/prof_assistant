import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  api,
  ApiError,
  examMatchesOffering,
  formatScopeSummary,
  type CourseOffering,
  type Exam,
} from "../api/client";
import { he } from "../i18n/he";

interface AddExistingExamDialogProps {
  open: boolean;
  offering: CourseOffering;
  visibleExamIds: number[];
  onClose: () => void;
  onAttached: () => void;
}

export default function AddExistingExamDialog({
  open,
  offering,
  visibleExamIds,
  onClose,
  onAttached,
}: AddExistingExamDialogProps) {
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachingId, setAttachingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const exams = await api<Exam[]>(`/api/exams/catalog/${offering.catalog_course_id}`);
      setAllExams(exams);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [offering.catalog_course_id]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const available = allExams.filter(
    (exam) => !visibleExamIds.includes(exam.id) && !examMatchesOffering(exam, offering),
  );

  const attach = async (exam: Exam) => {
    setAttachingId(exam.id);
    setError("");
    try {
      await api(`/api/exams/${exam.id}/attach-offering`, {
        method: "POST",
        body: JSON.stringify({ offering_id: offering.id }),
      });
      onAttached();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setAttachingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{he.addExistingExam}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {he.addExistingExamHint}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : available.length === 0 ? (
          <Typography color="text.secondary">{he.noExamsToAdd}</Typography>
        ) : (
          <List disablePadding>
            {available.map((exam) => (
              <ListItem key={exam.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  disabled={attachingId != null}
                  onClick={() => attach(exam)}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                >
                  <ListItemText
                    primary={exam.title}
                    secondary={`${exam.question_count} ${he.questionsInExam} · ${formatScopeSummary(exam)}`}
                  />
                  <Button size="small" variant="contained" disabled={attachingId === exam.id}>
                    {attachingId === exam.id ? he.loading : he.addToThisGroup}
                  </Button>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
      </DialogActions>
    </Dialog>
  );
}
