import { useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GeminiGeneratedQuestionsPreview from "./GeminiGeneratedQuestionsPreview";
import GeminiQuestionSeriesCard from "./GeminiQuestionSeriesCard";
import DisabledActionTooltip from "./DisabledActionTooltip";
import { api, ApiError, type ExamDetail } from "../api/client";
import {
  createGeminiQuestionSeries,
  type GeminiQuestionSeriesDraft,
} from "../types/geminiQuestionSeries";
import { parseQcmText, toImportPayload } from "../utils/qcmImportParser";
import { seriesListToApiPayload } from "../utils/geminiSeriesApi";
import { he } from "../i18n/he";

interface ExamEditorGeminiGenerationSectionProps {
  examId: number;
  exam: ExamDetail;
  onImported: () => void | Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function ExamEditorGeminiGenerationSection({
  examId,
  exam,
  onImported,
  onSuccess,
  onError,
}: ExamEditorGeminiGenerationSectionProps) {
  const [seriesList, setSeriesList] = useState<GeminiQuestionSeriesDraft[]>(() => [
    createGeminiQuestionSeries(),
  ]);
  const [generating, setGenerating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [draftText, setDraftText] = useState<string | null>(null);

  const editable = exam.is_editable;
  const totalQuestions = seriesList.reduce((sum, s) => sum + s.questionCount, 0);
  const allSeriesValid = seriesList.every(
    (s) => s.subject.trim().length > 0 && s.questionCount >= 1 && s.questionTypes.length > 0,
  );

  const parseResult = useMemo(
    () => (draftText ? parseQcmText(draftText) : null),
    [draftText],
  );

  const addSeries = () => setSeriesList((prev) => [...prev, createGeminiQuestionSeries()]);
  const updateSeries = (id: string, next: GeminiQuestionSeriesDraft) => {
    setSeriesList((prev) => prev.map((s) => (s.id === id ? next : s)));
  };
  const removeSeries = (id: string) => {
    setSeriesList((prev) => prev.filter((s) => s.id !== id));
  };

  const clearDraft = () => setDraftText(null);

  const generate = async () => {
    setGenerating(true);
    onError("");
    clearDraft();
    try {
      const res = await api<{ raw_text: string }>(`/api/exams/${examId}/questions/generate`, {
        method: "POST",
        body: JSON.stringify({ series: seriesListToApiPayload(seriesList) }),
      });
      const parsed = parseQcmText(res.raw_text);
      if (parsed.questions.length === 0) {
        onError(he.geminiParseFailed);
        return;
      }
      if (parsed.errors.length > 0) {
        onError(`${he.geminiParseFailed} (${parsed.errors.length})`);
      }
      setDraftText(res.raw_text);
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setGenerating(false);
    }
  };

  const acceptDraft = async () => {
    if (!parseResult || parseResult.questions.length === 0) return;
    setAccepting(true);
    onError("");
    try {
      const questionsLanguage = seriesList[0]?.language ?? "he";
      const res = await api<{ imported_count: number }>(`/api/exams/${examId}/questions/import`, {
        method: "POST",
        body: JSON.stringify({
          questions: toImportPayload(parseResult.questions),
          questions_language: questionsLanguage,
        }),
      });
      onSuccess(`${he.importSuccess}: ${res.imported_count} ${he.questionsImported}`);
      clearDraft();
      await onImported();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setAccepting(false);
    }
  };

  const showPreview =
    draftText && parseResult && parseResult.questions.length > 0 && parseResult.errors.length === 0;

  return (
    <Box dir="rtl">
      <Typography variant="body2" color="text.secondary" paragraph>
        {he.geminiGenerateIntro}
      </Typography>
      {!editable && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {he.examNotEditable}
        </Alert>
      )}
      {!showPreview &&
        seriesList.map((series, index) => (
          <GeminiQuestionSeriesCard
            key={series.id}
            index={index}
            series={series}
            canRemove={seriesList.length > 1}
            disabled={!editable || generating}
            onChange={(next) => updateSeries(series.id, next)}
            onRemove={() => removeSeries(series.id)}
          />
        ))}
      {!showPreview && (
        <>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addSeries}
            disabled={!editable || generating}
            sx={{ mb: 2 }}
          >
            {he.geminiAddSeries}
          </Button>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            {he.geminiSeriesTotalQuestions}: {totalQuestions}
          </Typography>
          <DisabledActionTooltip
            disabled={!editable || !allSeriesValid || generating}
            disabledReason={
              !editable
                ? he.examNotEditable
                : !allSeriesValid
                  ? he.geminiSeriesIncomplete
                  : undefined
            }
          >
            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={generate}
              disabled={generating}
            >
              {generating ? he.geminiGenerating : he.geminiGenerateQuestions}
            </Button>
          </DisabledActionTooltip>
        </>
      )}
      {draftText && parseResult && parseResult.errors.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {he.geminiParseFailed}
          {parseResult.errors.map((e) => (
            <Typography key={e.block} variant="body2">
              {he.questionBlock} {e.block}: {e.message}
            </Typography>
          ))}
          <Button size="small" onClick={clearDraft} sx={{ mt: 1 }}>
            {he.geminiRejectQuestions}
          </Button>
        </Alert>
      )}
      {showPreview && parseResult && (
        <GeminiGeneratedQuestionsPreview
          questions={parseResult.questions}
          accepting={accepting}
          editable={editable}
          onAccept={acceptDraft}
          onReject={clearDraft}
        />
      )}
    </Box>
  );
}
