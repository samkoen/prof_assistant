import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import type { AiPromptTemplate } from "../api/aiPrompts";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";
import { aiPromptLabel } from "../utils/aiPromptLabels";
import { aiPromptUsage } from "../utils/aiPromptUsage";

type Props = {
  template: AiPromptTemplate;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (body: string) => void;
  onReset: () => void;
};

function PromptUsageBlock({ promptKey }: { promptKey: string }) {
  const text = aiPromptUsage(promptKey);
  if (!text) return null;
  return (
    <>
      <Typography variant="subtitle2" sx={{ mt: 1.5, ...hebrewAlignRightSx }}>
        {he.aiPromptUsageCol}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, ...hebrewAlignRightSx, whiteSpace: "pre-wrap" }}>
        {text}
      </Typography>
    </>
  );
}

function PromptChips({ items, wrap }: { items: string[]; wrap?: boolean }) {
  if (items.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
      {items.map((item) => (
        <Chip key={item} size="small" label={wrap ? `{${item}}` : item} dir="ltr" />
      ))}
    </Box>
  );
}

export default function AiPromptEditDialog({
  template,
  saving,
  error,
  onClose,
  onSave,
  onReset,
}: Props) {
  const [body, setBody] = useState(template.body);
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle sx={hebrewAlignRightSx}>{aiPromptLabel(template.key)}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}
        <Typography variant="caption" color="text.secondary" dir="ltr" display="block">
          {template.key} · v{template.version}
        </Typography>
        <PromptUsageBlock promptKey={template.key} />
        <Typography variant="subtitle2" sx={{ mt: 1.5, ...hebrewAlignRightSx }}>
          {he.aiPromptPlaceholders}
        </Typography>
        <PromptChips items={template.placeholders} wrap />
        <Typography variant="subtitle2" sx={{ mt: 1.5, ...hebrewAlignRightSx }}>
          {he.aiPromptRequired}
        </Typography>
        <PromptChips items={template.required} />
        <TextField
          value={body}
          onChange={(e) => setBody(e.target.value)}
          multiline
          minRows={12}
          fullWidth
          sx={{ mt: 2 }}
          inputProps={{ dir: "ltr", style: { fontFamily: "ui-monospace, monospace", fontSize: 13 } }}
        />
      </DialogContent>
      <DialogActions sx={{ ...hebrewAlignRightSx, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose} disabled={saving}>
          {he.cancel}
        </Button>
        <Button onClick={onReset} disabled={saving} color="warning">
          {he.aiPromptReset}
        </Button>
        <Button onClick={() => onSave(body)} disabled={saving} variant="contained">
          {he.aiPromptSave}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
