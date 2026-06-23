import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";
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
import ExamEditorQuestionsPanel from "../../components/ExamEditorQuestionsPanel";
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
import {
  mergeSavedQuestion,
  questionsFingerprint,
  removeQuestionFromList,
  revertExamQuestionsToBaseline,
} from "../../utils/examEditorChanges";
import { he } from "../../i18n/he";

type ExamBaseline = {
  title: string;
  questions: Question[];
};

export default function TeacherExamEditorPage() {
  const { examId } = useParams<{ examId: string }>();
  const [searchParams] = useSearchParams();
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
  const [baseline, setBaseline] = useState<ExamBaseline | null>(null);
  const [discarding, setDiscarding] = useState(false);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<ExamDetail>(`/api/exams/${id}`);
      setExam(data);
      setTitleDraft(data.title);
      setBaseline((prev) => prev ?? { title: data.title, questions: data.questions });
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
  const titleChanged = titleDraft.trim() !== (baseline?.title ?? exam?.title ?? "");
  const titleValid = titleDraft.trim().length > 0;
  const questionsChanged = useMemo(() => {
    if (!exam || !baseline) return false;
    return questionsFingerprint(exam.questions) !== questionsFingerprint(baseline.questions);
  }, [exam, baseline]);
  const hasChanges = titleChanged || questionsChanged;
  const backLabel = returnTo.includes("/exams") ? he.backToExams : he.backToCourses;

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
      setBaseline((prev) => (prev ? { ...prev, title: updated.title } : prev));
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
      return false;
    } finally {
      setSavingTitle(false);
    }
  };

  const discardChanges = async () => {
    if (!baseline || !exam || !hasChanges) return;
    setDiscarding(true);
    setError("");
    try {
      setTitleDraft(baseline.title);
      if (questionsChanged) {
        await revertExamQuestionsToBaseline(id, baseline.questions, exam.questions);
        await load();
      } else {
        setExam((prev) => (prev ? { ...prev, title: baseline.title } : prev));
      }
      setSuccess(he.examChangesDiscarded);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setDiscarding(false);
    }
  };

  const saveChanges = async () => {
    if (!titleValid) {
      setError(he.examTitleRequired);
      return;
    }
    if (!(await saveTitle())) return;
    if (!exam) return;
    setBaseline({ title: titleDraft.trim(), questions: exam.questions });
    setSuccess(he.examSaved);
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

  const syncQuestionsState = useCallback((updater: (questions: Question[]) => Question[]) => {
    setExam((prev) => {
      if (!prev) return prev;
      const questions = updater(prev.questions);
      return { ...prev, questions, question_count: questions.length };
    });
    setBaseline((prev) => {
      if (!prev) return prev;
      return { ...prev, questions: updater(prev.questions) };
    });
  }, []);

  const deleteQuestion = async () => {
    if (!questionToDelete) return;
    const deletedId = questionToDelete.id;
    setDeletingQuestionId(deletedId);
    setError("");
    try {
      await api(`/api/exams/${id}/questions/${deletedId}`, { method: "DELETE" });
      setQuestionToDelete(null);
      setSuccess(he.questionDeleted);
      syncQuestionsState((questions) => removeQuestionFromList(questions, deletedId));
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

  const editBannerSubtitle = [exam.catalog_course_name, exam.title].filter(Boolean).join(" — ");

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }} dir="rtl">
      <Button
        component={RouterLink}
        to={returnTo}
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ mb: 1 }}
      >
        {backLabel}
      </Button>

      <PageHeroBanner title={he.editExam} subtitle={editBannerSubtitle} />

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

      <ExamEditorSectionAccordion title={he.examSettings} defaultExpanded={false}>
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
            sx={{ mb: 3 }}
          >
            {savingTitle ? he.loading : he.saveExamTitle}
          </Button>
        )}
        <ExamScopeEditor
          exam={exam}
          editable={exam.is_editable}
          embedded
          onSaved={(updated) => setExam((prev) => (prev ? { ...prev, ...updated } : prev))}
          onError={setError}
        />
      </ExamEditorSectionAccordion>

      <ExamEditorSectionAccordion
        title={he.examQuestions}
        subtitle={`${exam.question_count} ${he.questionsInExam}`}
        defaultExpanded
        detailsDir="rtl"
      >
        <ExamEditorQuestionsPanel
          examId={id}
          exam={exam}
          reordering={reordering}
          deletingQuestionId={deletingQuestionId}
          onMove={moveQuestion}
          onEdit={(q) => {
            setCreateQuestionOpen(false);
            setQuestionToEdit(q);
          }}
          onDelete={setQuestionToDelete}
          onAddManual={() => {
            setQuestionToEdit(null);
            setCreateQuestionOpen(true);
          }}
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
          onReload={load}
          onSuccess={setSuccess}
          onError={setError}
        />
      </ExamEditorSectionAccordion>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          mt: 3,
          flexWrap: "wrap",
        }}
      >
        <Button
          component={RouterLink}
          to={returnTo}
          startIcon={<ArrowBackIcon />}
          size="small"
        >
          {backLabel}
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={discardChanges} disabled={!hasChanges || discarding}>
            {discarding ? he.loading : he.cancel}
          </Button>
          <DisabledActionTooltip
            disabled={savingTitle || discarding || !titleValid || !hasChanges}
            disabledReason={
              !titleValid ? he.examTitleRequired : !hasChanges ? he.noChangesToSave : undefined
            }
          >
            <Button variant="contained" onClick={saveChanges}>
              {savingTitle ? he.loading : he.saveExam}
            </Button>
          </DisabledActionTooltip>
        </Box>
      </Box>

      <QuestionEditDialog
        examId={id}
        question={questionToEdit}
        open={!!questionToEdit || createQuestionOpen}
        onClose={() => {
          setQuestionToEdit(null);
          setCreateQuestionOpen(false);
        }}
        onSaved={(created, saved) => {
          setSuccess(created ? he.questionAdded : he.questionSaved);
          syncQuestionsState((questions) => mergeSavedQuestion(questions, saved, created));
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
