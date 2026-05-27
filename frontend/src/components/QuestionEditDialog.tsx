import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { api, ApiError, type Question } from "../api/client";
import DisabledActionTooltip from "./DisabledActionTooltip";
import { he } from "../i18n/he";
import { normalizeTextBlock } from "../utils/textNormalize";
import type { QuestionType } from "../utils/qcmImportParser";

interface OptionDraft {
  text: string;
  is_correct: boolean;
}

interface QuestionEditDialogProps {
  examId: number;
  /** null = création d’une nouvelle question */
  question: Question | null;
  open: boolean;
  onClose: () => void;
  onSaved: (created: boolean) => void;
}

const TF_OPTIONS: OptionDraft[] = [
  { text: "נכון", is_correct: true },
  { text: "לא נכון", is_correct: false },
];

const DEFAULT_OPTIONS: OptionDraft[] = [
  { text: "", is_correct: false },
  { text: "", is_correct: false },
];

function questionToDraft(q: Question) {
  return {
    text: q.text,
    question_type: q.question_type as QuestionType,
    points: q.points,
    options: q.options.map((o) => ({ text: o.text, is_correct: o.is_correct ?? false })),
  };
}

function validateDraft(
  text: string,
  questionType: QuestionType,
  options: OptionDraft[],
): string | null {
  if (!text.trim()) return he.questionTextRequired;
  if (questionType === "true_false") {
    if (options.length !== 2) return he.tfTwoOptionsRequired;
  } else if (options.length < 2) {
    return he.minTwoOptionsRequired;
  }
  const correct = options.filter((o) => o.is_correct);
  if (questionType === "single" || questionType === "true_false") {
    if (correct.length !== 1) return he.oneCorrectRequired;
  } else if (correct.length < 1) {
    return he.atLeastOneCorrectRequired;
  }
  if (options.some((o) => !o.text.trim())) return he.optionTextRequired;
  return null;
}

function buildPayload(
  text: string,
  questionType: QuestionType,
  points: number,
  options: OptionDraft[],
) {
  return {
    text: normalizeTextBlock(text),
    question_type: questionType,
    points,
    options: options.map((o, i) => ({
      text: normalizeTextBlock(o.text),
      is_correct: o.is_correct,
      order_index: i,
    })),
  };
}

function resetForm(
  question: Question | null,
  setters: {
    setText: (v: string) => void;
    setQuestionType: (v: QuestionType) => void;
    setPoints: (v: number) => void;
    setOptions: (v: OptionDraft[]) => void;
    setError: (v: string) => void;
  },
) {
  if (question) {
    const draft = questionToDraft(question);
    setters.setText(draft.text);
    setters.setQuestionType(draft.question_type);
    setters.setPoints(draft.points);
    setters.setOptions(draft.options);
  } else {
    setters.setText("");
    setters.setQuestionType("single");
    setters.setPoints(1);
    setters.setOptions(DEFAULT_OPTIONS.map((o) => ({ ...o })));
  }
  setters.setError("");
}

export default function QuestionEditDialog({
  examId,
  question,
  open,
  onClose,
  onSaved,
}: QuestionEditDialogProps) {
  const isCreate = question === null;
  const [text, setText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("single");
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    resetForm(question, { setText, setQuestionType, setPoints, setOptions, setError });
  }, [question, open]);

  const validationError = useMemo(
    () => validateDraft(text, questionType, options),
    [text, questionType, options],
  );

  const handleTypeChange = (type: QuestionType) => {
    setQuestionType(type);
    if (type === "true_false") setOptions(TF_OPTIONS);
  };

  const setCorrect = (index: number) => {
    if (questionType === "multiple") {
      setOptions((prev) =>
        prev.map((o, i) => (i === index ? { ...o, is_correct: !o.is_correct } : o)),
      );
      return;
    }
    setOptions((prev) => prev.map((o, i) => ({ ...o, is_correct: i === index })));
  };

  const save = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    const payload = buildPayload(text, questionType, points, options);
    try {
      if (isCreate) {
        await api<Question>(`/api/exams/${examId}/questions`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api<Question>(`/api/exams/${examId}/questions/${question.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      onSaved(isCreate);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isCreate ? he.addQuestion : he.editQuestion}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {validationError && !error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        <TextField
          label={he.questionText}
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
          multiline
          minRows={4}
          dir="rtl"
          sx={{ mb: 2, mt: 1, "& textarea": { fontFamily: "inherit", whiteSpace: "pre-wrap" } }}
        />

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{he.questionType}</InputLabel>
            <Select
              value={questionType}
              label={he.questionType}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            >
              <MenuItem value="single">{he.questionTypeSingle}</MenuItem>
              <MenuItem value="multiple">{he.questionTypeMultiple}</MenuItem>
              <MenuItem value="true_false">{he.questionTypeTrueFalse}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={he.points}
            type="number"
            value={points}
            onChange={(e) => setPoints(Math.max(0.5, Number(e.target.value) || 1))}
            inputProps={{ min: 0.5, step: 0.5 }}
            sx={{ width: 120 }}
          />
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          {he.options}
        </Typography>

        {options.map((opt, i) => (
          <OptionRow
            key={i}
            opt={opt}
            questionType={questionType}
            optionsCount={options.length}
            onCorrect={() => setCorrect(i)}
            onTextChange={(value) =>
              setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, text: value } : o)))
            }
            onRemove={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
          />
        ))}

        {questionType !== "true_false" && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOptions((prev) => [...prev, { text: "", is_correct: false }])}
            sx={{ mt: 1 }}
          >
            {he.addOption}
          </Button>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <DisabledActionTooltip
          disabled={saving || !!validationError}
          disabledReason={validationError || undefined}
        >
          <Button variant="contained" onClick={save}>
            {saving ? he.loading : he.saveQuestion}
          </Button>
        </DisabledActionTooltip>
      </DialogActions>
    </Dialog>
  );
}

function OptionRow({
  opt,
  questionType,
  optionsCount,
  onCorrect,
  onTextChange,
  onRemove,
}: {
  opt: OptionDraft;
  questionType: QuestionType;
  optionsCount: number;
  onCorrect: () => void;
  onTextChange: (value: string) => void;
  onRemove: () => void;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
      <FormControlLabel
        control={<Checkbox checked={opt.is_correct} onChange={onCorrect} color="success" />}
        label={he.correctAnswer}
        sx={{ mr: 0, minWidth: 100 }}
      />
      <TextField
        value={opt.text}
        onChange={(e) => onTextChange(e.target.value)}
        fullWidth
        size="small"
        multiline
        minRows={opt.text.includes("\n") ? 3 : 1}
        dir="rtl"
        disabled={questionType === "true_false"}
        sx={{ "& textarea": { whiteSpace: "pre-wrap", fontFamily: "monospace" } }}
      />
      {questionType !== "true_false" && optionsCount > 2 && (
        <IconButton size="small" color="error" onClick={onRemove} aria-label={he.deleteOption}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}
