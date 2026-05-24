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
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";
import { api, ApiError, type Exam, type ExamDetail } from "../../api/client";
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
            {exam.questions.map((q, i) => (
              <Box key={q.id} sx={{ mb: 2 }}>
                <Typography fontWeight={600}>
                  {i + 1}. {q.text}{" "}
                  <Chip size="small" label={typeLabel[q.question_type] ?? q.question_type} />
                  <Chip size="small" variant="outlined" label={`${q.points} נק'`} sx={{ ml: 0.5 }} />
                </Typography>
                {q.options.map((o) => (
                  <Typography
                    key={o.id}
                    variant="body2"
                    color={o.is_correct ? "success.main" : "text.secondary"}
                    sx={{ pr: 2 }}
                  >
                    {o.is_correct ? "✓ " : "○ "}
                    {o.text}
                  </Typography>
                ))}
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {he.pasteQcmHint}
          </Typography>

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

          <TextField
            multiline
            minRows={12}
            fullWidth
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={QCM_FORMAT_EXAMPLE}
            disabled={!exam.is_editable}
            dir="rtl"
            sx={{ fontFamily: "monospace", mb: 2 }}
          />

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
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={importQuestions}
                disabled={!exam.is_editable || importing}
              >
                {importing ? he.loading : he.importQuestions}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
        <Button variant="outlined" onClick={() => navigate(returnTo)}>
          {he.cancel}
        </Button>
        <Button variant="contained" onClick={finishEditing} disabled={savingTitle || !titleValid}>
          {savingTitle ? he.loading : he.saveExamDone}
        </Button>
      </Box>
    </Box>
  );
}

function PreviewQuestion({ index, question }: { index: number; question: ParsedQuestion }) {
  return (
    <Box sx={{ mb: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
      <Typography fontWeight={600}>
        {index}. {question.text}{" "}
        <Chip size="small" label={typeLabel[question.question_type]} />
      </Typography>
      {question.options.map((o, i) => (
        <Typography
          key={i}
          variant="body2"
          color={o.is_correct ? "success.main" : "text.secondary"}
        >
          {o.is_correct ? "✓ " : "○ "}
          {o.text}
        </Typography>
      ))}
    </Box>
  );
}
