import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, TextField } from "@mui/material";
import { api, ApiError } from "../../api/client";
import type { TaskStepRow } from "../../api/tasks";
import { he } from "../../i18n/he";
import { taskStepDraftError } from "../../utils/taskStepDraft";
import EmptyState from "../ui/EmptyState";

type Draft = { title: string; instructions: string; max_points: string };

const emptyDraft = (): Draft => ({ title: "", instructions: "", max_points: "1" });

function errorText(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

/** Liste des sous-tâches d'une משימה, à la place des questions. */
export default function TaskStepsEditor({ examId }: { examId: number }) {
  const [steps, setSteps] = useState<TaskStepRow[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [instructionsError, setInstructionsError] = useState(false);
  const load = useCallback(async () => {
    const rows = await api<TaskStepRow[]>(`/api/exams/${examId}/steps`);
    setSteps(rows);
  }, [examId]);

  useEffect(() => {
    load().catch((e) => setError(errorText(e)));
  }, [load]);

  const add = async () => {
    const message = taskStepDraftError(draft);
    if (message) {
      setInstructionsError(!draft.instructions.trim());
      setError(message);
      return;
    }
    setError("");
    setInstructionsError(false);
    try {
      await api(`/api/exams/${examId}/steps`, { method: "POST", body: JSON.stringify(bodyOf(draft)) });
      setDraft(emptyDraft());
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Box dir="rtl" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
      {steps.length === 0 && <EmptyState title={he.taskEmptySteps} />}
      {steps.map((step) => (
        <StepCard key={step.id} examId={examId} step={step} onChanged={load} onError={setError} />
      ))}
      <StepFields draft={draft} instructionsError={instructionsError} onChange={setDraft} />
      <Button variant="contained" onClick={() => void add()} sx={{ alignSelf: "flex-start" }}>{he.taskAddStep}</Button>
    </Box>
  );
}

function bodyOf(draft: Draft) {
  return { title: draft.title.trim(), instructions: draft.instructions.trim(), max_points: Number(draft.max_points) || 1 };
}

function StepFields({ draft, onChange, instructionsError = false }: { draft: Draft; onChange: (next: Draft) => void; instructionsError?: boolean }) {
  const missing = instructionsError && !draft.instructions.trim();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <TextField required label={he.taskStepTitle} value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
      <TextField required label={he.taskStepInstructions} value={draft.instructions} multiline minRows={3} error={missing} helperText={missing ? he.taskStepDescriptionRequired : undefined} onChange={(e) => onChange({ ...draft, instructions: e.target.value })} />
      <TextField label={he.taskStepPoints} type="number" value={draft.max_points} onChange={(e) => onChange({ ...draft, max_points: e.target.value })} inputProps={{ min: 1, max: 100, dir: "ltr" }} />
    </Box>
  );
}

function StepCard({ examId, step, onChanged, onError }: { examId: number; step: TaskStepRow; onChanged: () => Promise<void>; onError: (msg: string) => void }) {
  const [draft, setDraft] = useState<Draft>({ title: step.title, instructions: step.instructions, max_points: String(step.max_points) });
  const [instructionsError, setInstructionsError] = useState(false);
  const save = async () => {
    const message = taskStepDraftError(draft);
    if (message) {
      setInstructionsError(!draft.instructions.trim());
      onError(message);
      return;
    }
    setInstructionsError(false);
    try {
      await api(`/api/exams/${examId}/steps/${step.id}`, { method: "PATCH", body: JSON.stringify(bodyOf(draft)) });
      await onChanged();
    } catch (e) {
      onError(errorText(e));
    }
  };
  const remove = async () => {
    try {
      await api(`/api/exams/${examId}/steps/${step.id}`, { method: "DELETE" });
      await onChanged();
    } catch (e) {
      onError(errorText(e));
    }
  };
  return (
    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <StepFields draft={draft} instructionsError={instructionsError} onChange={setDraft} />
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <Button size="small" variant="outlined" onClick={() => void save()}>{he.taskSaveStep}</Button>
        <Button size="small" color="error" onClick={() => void remove()}>{he.taskDeleteStep}</Button>
      </Box>
    </Box>
  );
}
