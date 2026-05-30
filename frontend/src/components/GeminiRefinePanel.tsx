import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import type { GeminiGenerationMessage } from "../types/geminiQuestionSeries";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

type Props = {
  messages: GeminiGenerationMessage[];
  refining: boolean;
  disabled?: boolean;
  onSend: (message: string) => void;
};

function displayRefineText(content: string): string {
  const marker = "בקשת עדכון מהמורה:\n";
  if (!content.includes(marker)) return "";
  const after = content.split(marker, 2)[1] ?? "";
  return after.split("\n\n")[0].trim();
}

export default function GeminiRefinePanel({ messages, refining, disabled, onSend }: Props) {
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    onSend(text);
  };

  const history = messages
    .filter((m) => m.role === "user" && m.content.includes("בקשת עדכון מהמורה"))
    .map((m) => ({ id: m.id, text: displayRefineText(m.content) }))
    .filter((m) => m.text.length > 0);

  return (
    <Box sx={{ mt: 2 }} dir="rtl">
      <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={hebrewAlignRightSx}>
        {he.geminiConversationTitle}
      </Typography>
      {history.length > 0 && (
        <Box sx={{ mb: 2, maxHeight: 160, overflow: "auto" }}>
          {history.map((m) => (
            <Typography
              key={m.id}
              variant="body2"
              color="text.secondary"
              sx={{ ...hebrewAlignRightSx, mb: 0.75, py: 0.5, px: 1, bgcolor: "action.hover", borderRadius: 1 }}
            >
              {m.text}
            </Typography>
          ))}
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1, flexDirection: "row", dir: "ltr" }}>
        <Button
          variant="contained"
          size="small"
          endIcon={refining ? undefined : <SendIcon />}
          onClick={handleSend}
          disabled={disabled || refining || !draft.trim()}
          sx={{ flexShrink: 0 }}
        >
          {refining ? he.geminiRefining : he.geminiSendRefinement}
        </Button>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={2}
          maxRows={4}
          placeholder={he.geminiRefinePlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={disabled || refining}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          sx={{ ...hebrewAlignRightSx }}
        />
      </Box>
    </Box>
  );
}
