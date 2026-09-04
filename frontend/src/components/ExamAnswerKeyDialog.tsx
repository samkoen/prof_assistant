import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  Typography,
} from "@mui/material";
import LoadingButton from "./ui/LoadingButton";
import { api, ApiError, type Question } from "../api/client";
import { hebrewAlignRightSx, hebrewFormControlLabelSx } from "../styles/hebrewAlign";
import {
  answerKeyChanged,
  draftFromQuestions,
  isAnswerKeyDraftValid,
  qcmQuestions,
  toggleAnswerKeyOption,
  toAnswerKeyPayload,
  type AnswerKeyDraft,
} from "../utils/answerKeyDraft";
import { he } from "../i18n/he";

type Props = {
  open: boolean;
  examId: number;
  submittedCount: number;
  onClose: () => void;
  onSaved: (message: string) => void;
};

type AnswerKeyContentProps = {
  loading: boolean;
  error: string;
  qcm: Question[];
  draft: AnswerKeyDraft;
  submittedCount: number;
  canSave: boolean;
  onClearError: () => void;
  onToggle: (question: Question, optionId: number) => void;
};

function OptionPick({
  question,
  optionText,
  selected,
  onToggle,
}: {
  question: Question;
  optionText: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const control =
    question.question_type === "multiple" ? (
      <Checkbox checked={selected} onChange={onToggle} color="success" />
    ) : (
      <Radio checked={selected} onChange={onToggle} color="success" />
    );
  return (
    <FormControlLabel sx={hebrewFormControlLabelSx} control={control} label={optionText || he.correctAnswer} />
  );
}

function QuestionKeyBlock({
  question,
  selectedIds,
  onToggle,
}: {
  question: Question;
  selectedIds: number[];
  onToggle: (optionId: number) => void;
}) {
  const selected = new Set(selectedIds);
  return (
    <Box sx={{ mb: 2, ...hebrewAlignRightSx }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, ...hebrewAlignRightSx }}>
        {question.text}
      </Typography>
      {question.options.map((opt) => (
        <Box key={opt.id}>
          <OptionPick
            question={question}
            optionText={opt.text}
            selected={selected.has(opt.id)}
            onToggle={() => onToggle(opt.id)}
          />
        </Box>
      ))}
    </Box>
  );
}

async function loadExamQuestions(examId: number): Promise<Question[]> {
  const exam = await api<{ questions: Question[] }>(`/api/exams/${examId}`);
  return exam.questions;
}

async function saveAnswerKey(examId: number, draft: AnswerKeyDraft) {
  return api<{ questions_updated: number; regraded_attempts: number }>(
    `/api/exams/${examId}/answer-key`,
    { method: "POST", body: JSON.stringify(toAnswerKeyPayload(draft)) },
  );
}

function useLoadAnswerKey(open: boolean, examId: number) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draft, setDraft] = useState<AnswerKeyDraft>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setLoading(true);
    void loadExamQuestions(examId)
      .then((qs) => {
        setQuestions(qs);
        setDraft(draftFromQuestions(qs));
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : he.errorGeneric))
      .finally(() => setLoading(false));
  }, [open, examId]);

  return { questions, draft, setDraft, loading, error, setError };
}

async function persistAnswerKey(
  examId: number,
  draft: AnswerKeyDraft,
  onSaved: (message: string) => void,
  onClose: () => void,
  setError: (message: string) => void,
  setSaving: (saving: boolean) => void,
) {
  setSaving(true);
  setError("");
  try {
    const res = await saveAnswerKey(examId, draft);
    onSaved(he.correctAnswerKeySuccess(res.questions_updated, res.regraded_attempts));
    onClose();
  } catch (e) {
    setError(e instanceof ApiError ? e.message : he.errorGeneric);
  } finally {
    setSaving(false);
  }
}

function AnswerKeyContent({
  loading,
  error,
  qcm,
  draft,
  submittedCount,
  canSave,
  onClearError,
  onToggle,
}: AnswerKeyContentProps) {
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ...hebrewAlignRightSx }}>
        {he.correctAnswerKeyHint}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={onClearError}>
          {error}
        </Alert>
      )}
      {loading && <Typography>{he.loading}</Typography>}
      {!loading && qcm.length === 0 && <Alert severity="info">{he.correctAnswerKeyNoQcm}</Alert>}
      {qcm.map((question) => (
        <QuestionKeyBlock
          key={question.id}
          question={question}
          selectedIds={draft[question.id] ?? []}
          onToggle={(optionId) => onToggle(question, optionId)}
        />
      ))}
      {submittedCount > 0 && canSave && (
        <Alert severity="warning" sx={hebrewAlignRightSx}>
          {he.correctAnswerKeyConfirm(submittedCount)}
        </Alert>
      )}
    </>
  );
}

function canSaveDraft(questions: Question[], draft: AnswerKeyDraft, busy: boolean): boolean {
  const qcm = qcmQuestions(questions);
  return !busy && qcm.length > 0 && isAnswerKeyDraftValid(questions, draft) && answerKeyChanged(questions, draft);
}

export default function ExamAnswerKeyDialog({ open, examId, submittedCount, onClose, onSaved }: Props) {
  const loaded = useLoadAnswerKey(open, examId);
  const [saving, setSaving] = useState(false);
  const canSave = canSaveDraft(loaded.questions, loaded.draft, loaded.loading || saving);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle sx={hebrewAlignRightSx}>{he.correctAnswerKey}</DialogTitle>
      <DialogContent>
        <AnswerKeyContent
          loading={loaded.loading}
          error={loaded.error}
          qcm={qcmQuestions(loaded.questions)}
          draft={loaded.draft}
          submittedCount={submittedCount}
          canSave={canSave}
          onClearError={() => loaded.setError("")}
          onToggle={(question, optionId) =>
            loaded.setDraft((prev) => toggleAnswerKeyOption(prev, question, optionId))
          }
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: "flex-start" }}>
        <Button onClick={onClose}>{he.cancel}</Button>
        <LoadingButton
          variant="contained"
          loading={saving}
          disabled={!canSave}
          onClick={() =>
            void persistAnswerKey(examId, loaded.draft, onSaved, onClose, loaded.setError, setSaving)
          }
        >
          {he.saveAnswerKey}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
