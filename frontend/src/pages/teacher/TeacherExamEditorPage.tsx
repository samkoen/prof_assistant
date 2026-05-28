import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import ExamEditorGeminiGenerationSection from "../../components/ExamEditorGeminiGenerationSection";
import ExamEditorImportSection from "../../components/ExamEditorImportSection";
import ExamEditorQuestionsSection from "../../components/ExamEditorQuestionsSection";
import ExamEditorSectionAccordion from "../../components/ExamEditorSectionAccordion";
import QuestionEditDialog from "../../components/QuestionEditDialog";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import ExamScopeEditor from "../../components/ExamScopeEditor";
import PageHeroBanner from "../../components/ui/PageHeroBanner";
import { api, ApiError, type Exam, type ExamDetail, type Question } from "../../api/client";
import {
  parseQcmText,
  QCM_FORMAT_EXAMPLE,
  QCM_GEMINI_PROMPT,
  toImportPayload,
} from "../../utils/qcmImportParser";
import { he } from "../../i18n/he";

export default function TeacherExamEditorPage() {
  const { examId } = useParams<{ examId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = searchParams.get("return") || "/teacher/exams";
  const id = Number(examId);
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [paste, setPaste] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<ExamDetail>(`/api/exams/${id}`);
      setExam(data);
      setTitleDraft(data.title);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const parseResult = useMemo(() => parseQcmText(paste), [paste]);
  const titleChanged = titleDraft.trim() !== exam?.title;
  const titleValid = titleDraft.trim().length > 0;
  const hasQuestions = (exam?.questions.length ?? 0) > 0;

  const importQuestions = async () => {
    if (parseResult.errors.length > 0 || parseResult.questions.length === 0) return;
    setImporting(true);
    setError("");
    setSuccess("");
    try {
      const res = await api<{ imported_count: number }>(`/api/exams/${id}/questions/import`, {
        method: "POST",
        body: JSON.stringify({ questions: toImportPayload(parseResult.questions) }),
      });
      setSuccess(`${he.importSuccess}: ${res.imported_count} ${he.questionsImported}`);
      setPaste("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setImporting(false);
    }
  };

  const saveTitle = async (): Promise<boolean> => {
    if (!titleValid) {
      setError(he.examTitle);
      return false;
    }
    if (!titleChanged) return true;
    setSavingTitle(true);
    setError("");
    setSuccess("");
    try {
      const updated = await api<Exam>(`/api/exams/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: titleDraft.trim() }),
      });
      setExam((prev) => (prev ? { ...prev, title: updated.title } : prev));
      setTitleDraft(updated.title);
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
      return false;
    } finally {
      setSavingTitle(false);
    }
  };

  const finishEditing = async () => {
    if (await saveTitle()) navigate(returnTo);
  };

  const moveQuestion = async (index: number, direction: -1 | 1) => {
    if (!exam) return;
    const target = index + direction;
    if (target < 0 || target >= exam.questions.length) return;
    const ids = exam.questions.map((q) => q.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setReordering(true);
    setError("");
    try {
      const data = await api<ExamDetail>(`/api/exams/${id}/questions/reorder`, {
        method: "PUT",
        body: JSON.stringify({ question_ids: ids }),
      });
      setExam(data);
      setSuccess(he.questionsReordered);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setReordering(false);
    }
  };

  const deleteQuestion = async () => {
    if (!questionToDelete) return;
    setDeletingQuestionId(questionToDelete.id);
    setError("");
    try {
      await api(`/api/exams/${id}/questions/${questionToDelete.id}`, { method: "DELETE" });
      setQuestionToDelete(null);
      setSuccess(he.questionDeleted);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setDeletingQuestionId(null);
    }
  };

  if (loading && !exam) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!exam) {
    return <Alert severity="error">{error || he.errorGeneric}</Alert>;
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }} dir="rtl">
      <Button
        component={RouterLink}
        to={returnTo}
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ mb: 1 }}
      >
        {he.cancel}
      </Button>

      <PageHeroBanner title={he.editExam} subtitle={exam.title} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <ExamEditorSectionAccordion title={he.examTitle} defaultExpanded>
        <TextField
          label={he.examTitle}
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          fullWidth
          dir="rtl"
          inputProps={{ maxLength: 255 }}
          sx={{ mb: titleChanged && titleValid ? 2 : 0 }}
        />
        {titleChanged && titleValid && (
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={async () => {
              if (await saveTitle()) setSuccess(he.examTitleSaved);
            }}
            disabled={savingTitle}
          >
            {savingTitle ? he.loading : he.saveExamTitle}
          </Button>
        )}
      </ExamEditorSectionAccordion>

      <ExamEditorSectionAccordion title={he.examScope} defaultExpanded={false}>
        <ExamScopeEditor
          exam={exam}
          editable={exam.is_editable}
          embedded
          onSaved={(updated) => setExam((prev) => (prev ? { ...prev, ...updated } : prev))}
          onError={setError}
        />
      </ExamEditorSectionAccordion>

      <ExamEditorSectionAccordion
        title={he.existingQuestions}
        subtitle={`${exam.question_count} ${he.questionsInExam}`}
        defaultExpanded={hasQuestions}
        detailsDir="ltr"
      >
        <ExamEditorQuestionsSection
          exam={exam}
          reordering={reordering}
          deletingQuestionId={deletingQuestionId}
          onMove={moveQuestion}
          onEdit={(q) => {
            setCreateQuestionOpen(false);
            setQuestionToEdit(q);
          }}
          onDelete={setQuestionToDelete}
          onAdd={
            exam.is_editable
              ? () => {
                  setQuestionToEdit(null);
                  setCreateQuestionOpen(true);
                }
              : undefined
          }
        />
      </ExamEditorSectionAccordion>

      <ExamEditorSectionAccordion title={he.geminiGenerateQuestions} defaultExpanded={false}>
        <ExamEditorGeminiGenerationSection
          examId={id}
          exam={exam}
          onImported={load}
          onSuccess={setSuccess}
          onError={setError}
        />
      </ExamEditorSectionAccordion>

      <ExamEditorSectionAccordion title={he.pasteQcm} defaultExpanded={!hasQuestions}>
        <ExamEditorImportSection
          exam={exam}
          paste={paste}
          onPasteChange={setPaste}
          parseResult={parseResult}
          importing={importing}
          onCopyPrompt={async () => {
            await navigator.clipboard.writeText(QCM_GEMINI_PROMPT);
            setSuccess(he.promptCopied);
          }}
          onLoadExample={() => setPaste(QCM_FORMAT_EXAMPLE)}
          onImport={importQuestions}
        />
      </ExamEditorSectionAccordion>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
        <Button variant="outlined" onClick={() => navigate(returnTo)}>
          {he.cancel}
        </Button>
        <DisabledActionTooltip
          disabled={savingTitle || !titleValid}
          disabledReason={!titleValid ? he.examTitleRequired : undefined}
        >
          <Button variant="contained" onClick={finishEditing}>
            {savingTitle ? he.loading : he.saveExamDone}
          </Button>
        </DisabledActionTooltip>
      </Box>

      <QuestionEditDialog
        examId={id}
        question={questionToEdit}
        open={!!questionToEdit || createQuestionOpen}
        onClose={() => {
          setQuestionToEdit(null);
          setCreateQuestionOpen(false);
        }}
        onSaved={async (created) => {
          setSuccess(created ? he.questionAdded : he.questionSaved);
          await load();
        }}
      />

      <Dialog open={!!questionToDelete} onClose={() => setQuestionToDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>{he.deleteQuestion}</DialogTitle>
        <DialogContent>
          <Typography>{he.deleteQuestionConfirm}</Typography>
          {questionToDelete && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {questionToDelete.text}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionToDelete(null)}>{he.cancel}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={deleteQuestion}
            disabled={deletingQuestionId != null}
          >
            {deletingQuestionId != null ? he.loading : he.deleteQuestion}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
