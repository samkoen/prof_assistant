import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";
import QuestionEditDialog from "../../components/QuestionEditDialog";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import ExamScopeEditor from "../../components/ExamScopeEditor";
import { api, ApiError, type Exam, type ExamDetail, type Question } from "../../api/client";
import {
  parseQcmText,
  QCM_FORMAT_EXAMPLE,
  QCM_GEMINI_PROMPT,
  toImportPayload,
  type ParsedQuestion,
} from "../../utils/qcmImportParser";
import { he } from "../../i18n/he";

const typeLabel: Record<string, string> = {
  single: "בחירה יחידה",
  multiple: "בחירה מרובה",
  true_false: "נכון / לא נכון",
};

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

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(QCM_GEMINI_PROMPT);
    setSuccess(he.promptCopied);
  };

  const titleChanged = titleDraft.trim() !== exam?.title;
  const titleValid = titleDraft.trim().length > 0;

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
    const ok = await saveTitle();
    if (ok) navigate(returnTo);
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
    <Box sx={{ width: "100%", maxWidth: 960 }}>
      <Button
        component={RouterLink}
        to={returnTo}
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ mb: 2 }}
      >
        {he.cancel}
      </Button>

      <Typography variant="h5" fontWeight={700} gutterBottom>
        {he.editExam}
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
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
        </CardContent>
      </Card>

      <ExamScopeEditor
        exam={exam}
        editable={exam.is_editable}
        onSaved={(updated) => setExam((prev) => (prev ? { ...prev, ...updated } : prev))}
        onError={setError}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {exam.question_count} {he.questionsInExam}
        {!exam.is_editable && (
          <Chip size="small" color="warning" label={he.examNotEditable} sx={{ ml: 1 }} />
        )}
      </Typography>

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

      {exam.questions.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {he.existingQuestions}
            </Typography>
            {exam.is_editable && exam.questions.length > 1 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {he.reorderQuestionsHint}
              </Typography>
            )}
            {exam.questions.map((q, i) => (
              <Box
                key={q.id}
                sx={{
                  mb: 2,
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                }}
              >
                <Box flex={1} minWidth={0}>
                  <Typography
                    fontWeight={600}
                    component="div"
                    sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 0.5 }}
                  >
                    {i + 1}. {q.text}
                  </Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ mb: 0.5 }}>
                    <Chip size="small" label={typeLabel[q.question_type] ?? q.question_type} />
                    <Chip size="small" variant="outlined" label={`${q.points} נק'`} />
                  </Box>
                  {q.options.map((o) => (
                    <Typography
                      key={o.id}
                      variant="body2"
                      component="div"
                      color={o.is_correct ? "success.main" : "text.secondary"}
                      sx={{ pr: 2, whiteSpace: "pre-wrap", mt: 0.25 }}
                    >
                      {o.is_correct ? "✓ " : "○ "}
                      {o.text}
                    </Typography>
                  ))}
                </Box>
                {exam.is_editable && (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {exam.questions.length > 1 && (
                      <>
                        <DisabledActionTooltip
                          disabled={i === 0 || reordering}
                          disabledReason={i === 0 ? he.moveUpDisabled : undefined}
                        >
                          <IconButton
                            size="small"
                            onClick={() => moveQuestion(i, -1)}
                            aria-label={he.moveQuestionUp}
                          >
                            <KeyboardArrowUpIcon fontSize="small" />
                          </IconButton>
                        </DisabledActionTooltip>
                        <DisabledActionTooltip
                          disabled={i === exam.questions.length - 1 || reordering}
                          disabledReason={
                            i === exam.questions.length - 1 ? he.moveDownDisabled : undefined
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() => moveQuestion(i, 1)}
                            aria-label={he.moveQuestionDown}
                          >
                            <KeyboardArrowDownIcon fontSize="small" />
                          </IconButton>
                        </DisabledActionTooltip>
                      </>
                    )}
                    <Tooltip title={he.editQuestion}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setQuestionToEdit(q)}
                        aria-label={he.editQuestion}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={he.deleteQuestion}>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deletingQuestionId === q.id}
                      onClick={() => setQuestionToDelete(q)}
                      aria-label={he.deleteQuestion}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <ContentPasteIcon color="primary" />
            <Typography variant="h6">{he.pasteQcm}</Typography>
          </Box>
          <Box sx={{ mb: 2 }} dir="rtl">
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
              {he.pasteQcmHintIntro}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                {he.pasteQcmHintRule1}
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                {he.pasteQcmHintRule2}
              </Typography>
              <Typography component="li" variant="body2">
                {he.pasteQcmHintRule3}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
              {he.pasteQcmHintFormatLabel}
            </Typography>
            <Typography
              variant="caption"
              component="div"
              dir="ltr"
              sx={{
                mt: 1.5,
                px: 1.5,
                py: 0.75,
                bgcolor: "action.hover",
                borderRadius: 1,
                fontFamily: "monospace",
                textAlign: "left",
                color: "text.secondary",
              }}
            >
              {he.pasteQcmHintFormatExample}
            </Typography>
          </Box>

          <Button size="small" variant="outlined" onClick={copyPrompt} sx={{ mb: 1, mr: 1 }}>
            {he.copyGeminiPrompt}
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => setPaste(QCM_FORMAT_EXAMPLE)}
            sx={{ mb: 2 }}
          >
            {he.loadExample}
          </Button>

          <Box sx={{ width: "100%" }}>
          <DisabledActionTooltip
            disabled={!exam.is_editable}
            disabledReason={!exam.is_editable ? he.examNotEditable : undefined}
          >
            <TextField
              multiline
              minRows={12}
              fullWidth
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={QCM_FORMAT_EXAMPLE}
              dir="rtl"
              sx={{ fontFamily: "monospace", mb: 2 }}
            />
          </DisabledActionTooltip>
          </Box>

          {parseResult.errors.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {parseResult.errors.map((e) => (
                <Typography key={e.block} variant="body2">
                  {he.questionBlock} {e.block}: {e.message}
                </Typography>
              ))}
            </Alert>
          )}

          {parseResult.questions.length > 0 && parseResult.errors.length === 0 && (
            <>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {he.importPreview} ({parseResult.questions.length})
              </Typography>
              {parseResult.questions.map((q, i) => (
                <PreviewQuestion key={i} index={i + 1} question={q} />
              ))}
              <Divider sx={{ my: 2 }} />
              <DisabledActionTooltip
                disabled={!exam.is_editable || importing}
                disabledReason={!exam.is_editable ? he.examNotEditable : undefined}
              >
                <Button variant="contained" startIcon={<UploadIcon />} onClick={importQuestions}>
                  {importing ? he.loading : he.importQuestions}
                </Button>
              </DisabledActionTooltip>
            </>
          )}
        </CardContent>
      </Card>

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
        open={!!questionToEdit}
        onClose={() => setQuestionToEdit(null)}
        onSaved={async () => {
          setSuccess(he.questionSaved);
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

function PreviewQuestion({ index, question }: { index: number; question: ParsedQuestion }) {
  return (
    <Box sx={{ mb: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
        <Typography fontWeight={600} sx={{ whiteSpace: "pre-wrap" }}>
          {index}. {question.text}
        </Typography>
        <Chip size="small" label={typeLabel[question.question_type]} />
      </Box>
      {question.options.map((o, i) => (
        <Typography
          key={i}
          variant="body2"
          component="div"
          color={o.is_correct ? "success.main" : "text.secondary"}
          sx={{ whiteSpace: "pre-wrap", pl: 1, mt: 0.5 }}
        >
          {o.is_correct ? "✓ " : "○ "}
          {String.fromCharCode(65 + i)}){") "}
          {o.text}
        </Typography>
      ))}
    </Box>
  );
}
