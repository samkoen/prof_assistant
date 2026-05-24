import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { api, ApiError, type StudentOfferingExamResults } from "../api/client";
import { he } from "../i18n/he";

const statusLabel: Record<StudentOfferingExamResults["results"][0]["status"], string> = {
  not_started: he.resultNotStarted,
  in_progress: he.resultInProgress,
  submitted: he.resultSubmitted,
};

const statusColor: Record<
  StudentOfferingExamResults["results"][0]["status"],
  "default" | "warning" | "success"
> = {
  not_started: "default",
  in_progress: "warning",
  submitted: "success",
};

const sessionStatusLabel: Record<string, string> = {
  active: he.examAlreadyActive,
  closed: he.examClosed,
  draft: he.draftExams,
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("he-IL");
}

interface StudentGradesDialogProps {
  open: boolean;
  offeringId: number;
  studentId: number;
  studentName: string;
  onClose: () => void;
}

export default function StudentGradesDialog({
  open,
  offeringId,
  studentId,
  studentName,
  onClose,
}: StudentGradesDialogProps) {
  const [data, setData] = useState<StudentOfferingExamResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError("");
    try {
      setData(
        await api<StudentOfferingExamResults>(
          `/api/courses/${offeringId}/students/${studentId}/exam-results`,
        ),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [open, offeringId, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const submittedCount = data?.results.filter((r) => r.status === "submitted").length ?? 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{he.studentExamGrades}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {studentName}
        </Typography>
        {data && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {data.offering_label} · {he.resultsSummary}: {submittedCount} / {data.results.length}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : !data || data.results.length === 0 ? (
          <Typography color="text.secondary">{he.noExamGradesYet}</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{he.examTitle}</TableCell>
                  <TableCell>{he.status}</TableCell>
                  <TableCell align="left">{he.score}</TableCell>
                  <TableCell align="left">{he.submittedAt}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.results.map((row) => (
                  <TableRow key={row.session_id}>
                    <TableCell>{row.exam_title}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={statusLabel[row.status]}
                        color={statusColor[row.status]}
                        sx={{ mr: 0.5 }}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={sessionStatusLabel[row.session_status] ?? row.session_status}
                      />
                    </TableCell>
                    <TableCell align="left">
                      {row.score != null && row.max_score != null
                        ? `${row.score} / ${row.max_score}`
                        : "—"}
                    </TableCell>
                    <TableCell align="left">{formatDateTime(row.submitted_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
      </DialogActions>
    </Dialog>
  );
}
