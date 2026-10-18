import { useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, MenuItem, TextField, Typography } from "@mui/material";
import { api, ApiError } from "../../api/client";
import { fetchProofObjectUrl, type TaskReviewRow } from "../../api/tasks";
import { he } from "../../i18n/he";
import { verdictLabel } from "../../utils/taskVerdict";

type Props = { open: boolean; sessionId: number; attemptId: number | null; studentName: string; onClose: () => void };

function errorText(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

/** Le professeur voit les preuves, lance l'IA, puis peut corriger le verdict et la note. */
export default function TaskReviewDialog({ open, sessionId, attemptId, studentName, onClose }: Props) {
  const [rows, setRows] = useState<TaskReviewRow[]>([]);
  const [error, setError] = useState("");
  const load = async () => {
    if (!attemptId) return;
    const data = await api<TaskReviewRow[]>(`/api/exams/sessions/${sessionId}/attempts/${attemptId}/task`);
    setRows(data);
  };

  useEffect(() => {
    if (!open || !attemptId) return;
    load().catch((e) => setError(errorText(e)));
  }, [open, attemptId, sessionId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle>{he.taskReviewTitle} — {studentName}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {rows.map((row) => (
          <ReviewCard key={`${row.step_id}-${row.source}-${row.score}-${row.verdict}`} sessionId={sessionId} attemptId={attemptId} row={row} onChanged={load} onError={setError} />
        ))}
      </DialogContent>
    </Dialog>
  );
}

function ReviewCard({ sessionId, attemptId, row, onChanged, onError }: { sessionId: number; attemptId: number | null; row: TaskReviewRow; onChanged: () => Promise<void>; onError: (msg: string) => void }) {
  const [verdict, setVerdict] = useState<string>(row.verdict || "not_done");
  const [score, setScore] = useState(String(row.score ?? 0));
  const [note, setNote] = useState(row.appreciation || "");
  const [preview, setPreview] = useState("");

  const run = async (path: string, options: RequestInit) => {
    try {
      const next = await api<TaskReviewRow[]>(path, options);
      onError("");
      await onChanged();
      return next;
    } catch (e) {
      onError(errorText(e));
      return null;
    }
  };

  const showProof = async () => {
    if (!attemptId) return;
    const url = await fetchProofObjectUrl(`/api/exams/sessions/${sessionId}/attempts/${attemptId}/steps/${row.step_id}/proof`);
    setPreview(url);
  };

  return (
    <Box sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Typography fontWeight={800}>{row.title}</Typography>
      <Typography sx={{ whiteSpace: "pre-wrap", my: 1 }}>{row.instructions}</Typography>
      <Typography variant="body2">{row.has_proof ? row.proof_filename : he.taskProofMissing} · {verdictLabel(row.verdict)}</Typography>
      {row.has_proof && <Button size="small" onClick={() => void showProof()}>{he.taskProofReady}</Button>}
      {preview && <Box component="img" src={preview} alt="" sx={{ maxWidth: "100%", mt: 1, display: "block" }} />}
      {row.has_proof && attemptId && (
        <Button size="small" variant="contained" sx={{ mt: 1 }} onClick={() => void run(`/api/exams/sessions/${sessionId}/attempts/${attemptId}/steps/${row.step_id}/verify`, { method: "POST" })}>
          {he.taskVerify}
        </Button>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
        <TextField select label={he.status} value={verdict} onChange={(e) => setVerdict(e.target.value)}>
          <MenuItem value="done">{he.taskVerdictDone}</MenuItem>
          <MenuItem value="partial">{he.taskVerdictPartial}</MenuItem>
          <MenuItem value="not_done">{he.taskVerdictNotDone}</MenuItem>
        </TextField>
        <TextField label={he.taskStepPoints} type="number" value={score} onChange={(e) => setScore(e.target.value)} inputProps={{ dir: "ltr" }} />
        <TextField label={he.taskAppreciation} value={note} multiline minRows={2} onChange={(e) => setNote(e.target.value)} />
        {attemptId && (
          <Button variant="outlined" onClick={() => void run(`/api/exams/sessions/${sessionId}/attempts/${attemptId}/steps/${row.step_id}`, { method: "PATCH", body: JSON.stringify({ verdict, score: Number(score) || 0, appreciation: note || "-" }) })}>
            {he.taskSaveReview}
          </Button>
        )}
      </Box>
    </Box>
  );
}
