import { useState } from "react";
import { Box, Chip, IconButton, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { he } from "../../i18n/he";
import {
  canSendTutorMessage,
  fullExplanationAction,
  tutorStarterActions,
  type TutorAction,
} from "../../utils/tutorQuickActions";

interface TutorComposerProps {
  isCorrect: boolean | null;
  started: boolean;
  remaining: number;
  maxChars: number;
  busy: boolean;
  onSend: (text: string, action: TutorAction | null) => Promise<boolean>;
}

/** Démarrages rapides, « explication complète » et zone de saisie. */
export default function TutorComposer({ isCorrect, started, remaining, maxChars, busy, onSend }: TutorComposerProps) {
  const [draft, setDraft] = useState("");
  const quick = started ? [fullExplanationAction] : [...tutorStarterActions(isCorrect), fullExplanationAction];
  const submit = async () => {
    if (!canSendTutorMessage(draft, remaining, busy)) return;
    if (await onSend(draft.trim(), null)) setDraft("");
  };
  if (remaining <= 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        {he.tutorLimitReached}
      </Typography>
    );
  }
  return (
    <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {quick.map((q) => (
          <Chip key={q.action} label={q.label} variant="outlined" color="primary" size="small" disabled={busy} onClick={() => onSend(q.label, q.action)} />
        ))}
      </Box>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        <TextField
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, maxChars))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={he.tutorPlaceholder}
          multiline
          maxRows={4}
          size="small"
          fullWidth
          dir="auto"
        />
        <IconButton color="primary" aria-label={he.tutorSend} onClick={() => void submit()} disabled={!canSendTutorMessage(draft, remaining, busy)}>
          <SendIcon sx={{ transform: "scaleX(-1)" }} />
        </IconButton>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {he.tutorRemaining(remaining)}
      </Typography>
    </Box>
  );
}
