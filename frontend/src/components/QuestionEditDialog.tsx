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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import DirectionalMultilineField from "./DirectionalMultilineField";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { api, ApiError, type Question } from "../api/client";
import DisabledActionTooltip from "./DisabledActionTooltip";
import QuestionImageField from "./QuestionImageField";
import QuestionDraftPreview from "./QuestionDraftPreview";
import { hebrewActionsBarRtlSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";
import { normalizeTextBlock } from "../utils/textNormalize";
import type { QuestionType } from "../utils/qcmImportParser";

interface OptionDraft {
  text: string;
  is_correct: boolean;
  image_url?: string | null;
}

interface QuestionEditDialogProps {
  examId: number;
  /** null = création d’une nouvelle question */
  question: Question | null;
  open: boolean;
  onClose: () => void;
  onSaved: (created: boolean, saved: Question) => void;
}

type QuestionViewMode = "edit" | "preview";

const TF_OPTIONS: OptionDraft[] = [
  { text: "נכון", is_correct: true },
  { text: "לא נכון", is_correct: false },
];

const DEFAULT_OPTIONS: OptionDraft[] = [
  { text: "", is_correct: false },
  { text: "", is_correct: false },
];

function hasContent(text: string, imageUrl?: string | null): boolean {
  return text.trim().length > 0 || !!imageUrl?.trim();
}

function hasPreviewContent(
  text: string,
  imageUrl: string | null,
  options: OptionDraft[],
): boolean {
  if (text.trim() || imageUrl?.trim()) return true;
  return options.some((o) => o.text.trim() || o.image_url?.trim());
}

function questionToDraft(q: Question) {
  return {
    text: q.text,
    image_url: q.image_url ?? null,
    question_type: q.question_type as QuestionType,
    points: q.points,
    model_answer: q.model_answer ?? "",
    model_answer_source: q.model_answer_source ?? null,
    options: q.options.map((o) => ({
      text: o.text,
      is_correct: o.is_correct ?? false,
      image_url: o.image_url ?? null,
    })),
  };
}

function validateDraft(
  text: string,
  imageUrl: string | null,
  questionType: QuestionType,
  options: OptionDraft[],
): string | null {
  if (!hasContent(text, imageUrl)) return he.questionContentRequired;
  if (questionType === "open") return null;
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
  if (options.some((o) => !hasContent(o.text, o.image_url))) return he.optionContentRequired;
  return null;
}

function buildPayload(
  text: string,
  imageUrl: string | null,
  questionType: QuestionType,
  points: number,
  options: OptionDraft[],
  modelAnswer: string,
  modelAnswerSource: "teacher" | "ai" | null,
) {
  const isOpen = questionType === "open";
  return {
    text: normalizeTextBlock(text),
    image_url: imageUrl || null,
    question_type: questionType,
    points,
    model_answer: isOpen ? normalizeTextBlock(modelAnswer) || null : null,
    model_answer_source: isOpen ? modelAnswerSource : null,
    options: isOpen
      ? []
      : options.map((o, i) => ({
          text: normalizeTextBlock(o.text),
          image_url: o.image_url || null,
          is_correct: o.is_correct,
          order_index: i,
        })),
  };
}

function resetForm(
  question: Question | null,
  setters: {
    setText: (v: string) => void;
    setImageUrl: (v: string | null) => void;
    setQuestionType: (v: QuestionType) => void;
    setPoints: (v: number) => void;
    setOptions: (v: OptionDraft[]) => void;
    setModelAnswer: (v: string) => void;
    setModelAnswerSource: (v: "teacher" | "ai" | null) => void;
    setError: (v: string) => void;
    setViewMode: (v: QuestionViewMode) => void;
  },
) {
  if (question) {
    const draft = questionToDraft(question);
    setters.setText(draft.text);
    setters.setImageUrl(draft.image_url);
    setters.setQuestionType(draft.question_type);
    setters.setPoints(draft.points);
    setters.setOptions(draft.options);
    setters.setModelAnswer(draft.model_answer);
    setters.setModelAnswerSource(draft.model_answer_source);
  } else {
    setters.setText("");
    setters.setImageUrl(null);
    setters.setQuestionType("single");
    setters.setPoints(1);
    setters.setOptions(DEFAULT_OPTIONS.map((o) => ({ ...o })));
    setters.setModelAnswer("");
    setters.setModelAnswerSource(null);
  }
  setters.setError("");
  setters.setViewMode("edit");
}

function QuestionViewModeToggle({
  mode,
  onChange,
}: {
  mode: QuestionViewMode;
  onChange: (mode: QuestionViewMode) => void;
}) {
  return (
    <Box sx={{ ...hebrewActionsBarRtlSx, mb: 2 }}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={mode}
        onChange={(_, value: QuestionViewMode | null) => {
          if (value) onChange(value);
        }}
        aria-label={he.questionEditPreview}
      >
        <ToggleButton value="edit">
          <EditOutlinedIcon fontSize="small" sx={{ ml: 0.5 }} />
          {he.questionEditMode}
        </ToggleButton>
        <ToggleButton value="preview">
          <VisibilityOutlinedIcon fontSize="small" sx={{ ml: 0.5 }} />
          {he.questionEditPreview}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>("single");
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [modelAnswer, setModelAnswer] = useState("");
  const [modelAnswerSource, setModelAnswerSource] = useState<"teacher" | "ai" | null>(null);
  const [generatingModel, setGeneratingModel] = useState(false);
  const [viewMode, setViewMode] = useState<QuestionViewMode>("edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    resetForm(question, {
      setText,
      setImageUrl,
      setQuestionType,
      setPoints,
      setOptions,
      setModelAnswer,
      setModelAnswerSource,
      setError,
      setViewMode,
    });
  }, [question, open]);

  const validationError = useMemo(
    () => validateDraft(text, imageUrl, questionType, options),
    [text, imageUrl, questionType, options],
  );
  const showPreview = hasPreviewContent(text, imageUrl, options);

  const handleTypeChange = (type: QuestionType) => {
    setQuestionType(type);
    if (type === "true_false") {
      setOptions(TF_OPTIONS.map((o) => ({ ...o })));
      return;
    }
    if (type === "open") {
      setOptions([]);
      return;
    }
    setOptions((prev) => (prev.length >= 2 ? prev : DEFAULT_OPTIONS.map((o) => ({ ...o }))));
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
    const payload = buildPayload(
      text,
      imageUrl,
      questionType,
      points,
      options,
      modelAnswer,
      modelAnswerSource,
    );
    try {
      let saved: Question;
      if (isCreate) {
        saved = await api<Question>(`/api/exams/${examId}/questions`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        saved = await api<Question>(`/api/exams/${examId}/questions/${question.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      onSaved(isCreate, saved);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isCreate ? he.addQuestion : he.editQuestion}</DialogTitle>
      <DialogContent dir="rtl">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {validationError && !error && viewMode === "edit" && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        <QuestionViewModeToggle mode={viewMode} onChange={setViewMode} />

        {viewMode === "preview" ? (
          showPreview ? (
            <QuestionDraftPreview
              text={text}
              imageUrl={imageUrl}
              questionType={questionType}
              points={points}
              options={options}
              showHeading={false}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              {he.questionEditPreviewEmpty}
            </Typography>
          )
        ) : (
          <>
            <DirectionalMultilineField
              variant="mixed"
              enableCodeMarkup
              label={he.questionText}
              value={text}
              onChange={setText}
              minRows={4}
              maxRows={12}
              placeholder={he.mathMarkupHint}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, mt: -0.5 }}>
              {he.mathMarkupHint}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {he.questionCodeMarkupHint}
            </Typography>
            <QuestionImageField
              examId={examId}
              value={imageUrl}
              onChange={setImageUrl}
              label={he.questionImageLabel}
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
                  <MenuItem value="open">{he.questionTypeOpen}</MenuItem>
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

            {questionType === "open" ? (
              <OpenModelAnswerFields
                examId={examId}
                questionText={text}
                modelAnswer={modelAnswer}
                generating={generatingModel}
                onChange={(value) => {
                  setModelAnswer(value);
                  setModelAnswerSource("teacher");
                }}
                onGenerated={(value) => {
                  setModelAnswer(value);
                  setModelAnswerSource("ai");
                }}
                onGenerating={setGeneratingModel}
                onError={setError}
              />
            ) : (
              <>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {he.options}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {he.questionCodeMarkupHint}
            </Typography>

            {options.map((opt, i) => (
              <OptionRow
                key={i}
                examId={examId}
                opt={opt}
                questionType={questionType}
                optionsCount={options.length}
                onCorrect={() => setCorrect(i)}
                onTextChange={(value) =>
                  setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, text: value } : o)))
                }
                onImageChange={(url) =>
                  setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, image_url: url } : o)))
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
              </>
            )}
          </>
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
  examId,
  opt,
  questionType,
  optionsCount,
  onCorrect,
  onTextChange,
  onImageChange,
  onRemove,
}: {
  examId: number;
  opt: OptionDraft;
  questionType: QuestionType;
  optionsCount: number;
  onCorrect: () => void;
  onTextChange: (value: string) => void;
  onImageChange: (url: string | null) => void;
  onRemove: () => void;
}) {
  const canRemove = questionType !== "true_false" && optionsCount > 2;

  return (
    <Box
      sx={{
        mb: 1,
        p: 1,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
      }}
    >
      <DirectionalMultilineField
        variant="mixed"
        enableCodeMarkup
        value={opt.text}
        onChange={onTextChange}
        size="small"
        minRows={opt.text.includes("\n") ? 3 : 1}
        maxRows={8}
        disabled={questionType === "true_false"}
        showHint={false}
        sx={{ mb: 0.25 }}
        toolbarInlineStart={
          <FormControlLabel
            control={
              <Checkbox checked={opt.is_correct} onChange={onCorrect} color="success" size="small" />
            }
            label={he.correctAnswer}
            sx={{
              flexShrink: 0,
              mr: 0,
              ml: 0,
              my: 0,
              "& .MuiFormControlLabel-label": { typography: "body2", whiteSpace: "nowrap" },
            }}
          />
        }
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mt: 0.25 }}>
        <QuestionImageField
          examId={examId}
          value={opt.image_url}
          onChange={onImageChange}
          compact
        />
        {canRemove && (
          <Tooltip title={he.deleteOption}>
            <IconButton size="small" color="error" onClick={onRemove} aria-label={he.deleteOption}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

function OpenModelAnswerFields({
  examId,
  questionText,
  modelAnswer,
  generating,
  onChange,
  onGenerated,
  onGenerating,
  onError,
}: {
  examId: number;
  questionText: string;
  modelAnswer: string;
  generating: boolean;
  onChange: (value: string) => void;
  onGenerated: (value: string) => void;
  onGenerating: (v: boolean) => void;
  onError: (v: string) => void;
}) {
  const generate = async () => {
    if (!questionText.trim()) {
      onError(he.questionContentRequired);
      return;
    }
    onGenerating(true);
    onError("");
    try {
      const res = await api<{ model_answer: string }>(`/api/exams/${examId}/open-model-answer`, {
        method: "POST",
        body: JSON.stringify({ question_text: questionText, language: "he" }),
      });
      onGenerated(res.model_answer);
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      onGenerating(false);
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <DirectionalMultilineField
        variant="mixed"
        enableCodeMarkup
        label={he.modelAnswerLabel}
        value={modelAnswer}
        onChange={onChange}
        minRows={3}
        maxRows={10}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        {he.modelAnswerHint}
      </Typography>
      <Button
        size="small"
        variant="outlined"
        onClick={generate}
        disabled={generating || !questionText.trim()}
        startIcon={generating ? <CircularProgress size={16} /> : undefined}
      >
        {generating ? he.loading : he.generateModelAnswer}
      </Button>
    </Box>
  );
}
