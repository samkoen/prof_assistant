import { useEffect, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import { api } from "../../../api/client";
import type { TaskReviewRow } from "../../../api/tasks";
import { he } from "../../../i18n/he";
import { verdictLabel } from "../../../utils/taskVerdict";

/** Résultat élève : en attente, ou verdict publié par le professeur. */
export default function TaskResultPanel({ sessionId }: { sessionId: number }) {
  const [published, setPublished] = useState(false);
  const [gradingLocked, setGradingLocked] = useState(false);
  const [steps, setSteps] = useState<TaskReviewRow[]>([]);

  useEffect(() => {
    api<{ published: boolean; grading_locked?: boolean; steps: TaskReviewRow[] }>(`/api/exams/sessions/${sessionId}/task-result`)
      .then((data) => {
        setPublished(data.published);
        setGradingLocked(Boolean(data.grading_locked));
        setSteps(data.steps);
      })
      .catch(() => setPublished(false));
  }, [sessionId]);

  if (!published) return <Alert severity="info" sx={{ mt: 2 }}>{he.taskWaitingReview}</Alert>;
  return (
    <Box dir="rtl" sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
      {gradingLocked && <Alert severity="info">{he.gradingLockedStudent}</Alert>}
      {steps.map((step) => (
        <Box key={step.step_id} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography fontWeight={800}>{step.title}</Typography>
          {!gradingLocked && <Typography>{verdictLabel(step.verdict)} · {step.score ?? 0} / {step.max_points}</Typography>}
          {step.has_proof && gradingLocked && <Typography>{step.proof_filename}</Typography>}
          {step.appreciation && <Typography sx={{ whiteSpace: "pre-wrap", mt: 1 }}>{step.appreciation}</Typography>}
        </Box>
      ))}
    </Box>
  );
}
