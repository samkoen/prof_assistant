import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { api, ApiError } from "../../../api/client";
import { uploadTaskProof, type TaskStepRow } from "../../../api/tasks";
import { he } from "../../../i18n/he";

function errorText(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

/** Passation d'une משימה : une preuve par sous-tâche, puis envoi. */
export default function TaskTakePanel({ sessionId, submitting, onSubmit }: { sessionId: number; submitting: boolean; onSubmit: () => void }) {
  const [steps, setSteps] = useState<TaskStepRow[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setSteps(await api<TaskStepRow[]>(`/api/exams/sessions/${sessionId}/steps`));
  }, [sessionId]);

  useEffect(() => {
    load().catch((e) => setError(errorText(e)));
  }, [load]);

  return (
    <Box dir="rtl" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {steps.map((step) => (
        <ProofCard key={step.id} sessionId={sessionId} step={step} onUploaded={load} onError={setError} />
      ))}
      <Button variant="contained" size="large" disabled={submitting || steps.length === 0} onClick={onSubmit}>
        {submitting ? he.loading : he.taskSubmit}
      </Button>
    </Box>
  );
}

function ProofCard({ sessionId, step, onUploaded, onError }: { sessionId: number; step: TaskStepRow; onUploaded: () => Promise<void>; onError: (msg: string) => void }) {
  const send = async (file: File | undefined) => {
    if (!file) return;
    try {
      await uploadTaskProof(sessionId, step.id, file);
      await onUploaded();
    } catch (e) {
      onError(errorText(e));
    }
  };
  return (
    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Typography fontWeight={800}>{step.title}</Typography>
      <Typography sx={{ whiteSpace: "pre-wrap", my: 1 }}>{step.instructions}</Typography>
      <Typography variant="body2" color="text.secondary" dir="ltr">{step.proof_filename || he.taskNoProof}</Typography>
      <Button component="label" variant="outlined" sx={{ mt: 1 }}>
        {step.proof_ready ? he.taskReplaceProof : he.taskUploadProof}
        <input hidden type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.docx" onChange={(e) => void send(e.target.files?.[0])} />
      </Button>
    </Box>
  );
}
