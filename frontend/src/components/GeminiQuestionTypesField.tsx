import { Box, Checkbox, ListItemText, MenuItem, TextField } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { QuestionType } from "../utils/qcmImportParser";
import { GEMINI_QUESTION_TYPES } from "../types/geminiQuestionSeries";
import { he } from "../i18n/he";

const TYPE_LABELS: Record<QuestionType, string> = {
  single: he.questionTypeSingle,
  multiple: he.questionTypeMultiple,
  true_false: he.questionTypeTrueFalse,
  open: he.questionTypeOpen,
};

function formatSelectedTypes(types: QuestionType[]): string {
  return types.map((t) => TYPE_LABELS[t]).join(", ");
}

function parseSelected(raw: unknown): QuestionType[] {
  if (typeof raw === "string") return raw.split(",") as QuestionType[];
  return raw as QuestionType[];
}

interface GeminiQuestionTypesFieldProps {
  value: QuestionType[];
  onChange: (types: QuestionType[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function GeminiQuestionTypesField({
  value,
  onChange,
  disabled = false,
  compact = false,
}: GeminiQuestionTypesFieldProps) {
  const handleChange = (event: SelectChangeEvent<QuestionType[]>) => {
    const next = parseSelected(event.target.value);
    if (next.length === 0) return;
    onChange(next);
  };

  return (
    <Box sx={compact ? { flex: 1, minWidth: { xs: "100%", sm: 200 } } : { width: "100%" }}>
      <TextField
        select
        label={he.geminiSeriesQuestionTypes}
        size="small"
        value={value}
        onChange={(event) => handleChange(event as SelectChangeEvent<QuestionType[]>)}
        slotProps={{
          select: {
            multiple: true,
            renderValue: (selected) => formatSelectedTypes(selected as QuestionType[]),
          },
        }}
        fullWidth={!compact}
        dir="rtl"
        disabled={disabled}
        error={value.length === 0}
        helperText={value.length === 0 ? he.geminiSeriesTypesRequired : undefined}
        sx={compact ? { minWidth: 0 } : undefined}
      >
        {GEMINI_QUESTION_TYPES.map((type) => (
          <MenuItem key={type} value={type} dir="rtl">
            <Checkbox size="small" checked={value.includes(type)} sx={{ py: 0 }} />
            <ListItemText primary={TYPE_LABELS[type]} />
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
