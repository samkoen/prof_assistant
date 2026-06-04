import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GeminiGeneratedQuestionsPreview from "./GeminiGeneratedQuestionsPreview";
import GeminiQuestionSeriesCard from "./GeminiQuestionSeriesCard";
import ExamGeminiSourcesPanel from "./ExamGeminiSourcesPanel";
import GeminiRefinePanel from "./GeminiRefinePanel";
import DisabledActionTooltip from "./DisabledActionTooltip";
import { api, ApiError, type ExamDetail } from "../api/client";
import {
  createGeminiQuestionSeries,
  type GeminiGenerationSession,
  type GeminiQuestionSeriesDraft,
} from "../types/geminiQuestionSeries";
import { parseQcmText, toImportPayload } from "../utils/qcmImportParser";
import {
  geminiParseErrorDetail,
  geminiParseErrorLocation,
} from "../utils/geminiParseErrors";
import { seriesListToApiPayload } from "../utils/geminiSeriesApi";
import { hebrewActionsBarRtlSx, hebrewAlignRightSx } from "../styles/hebrewAlign";
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
  const [session, setSession] = useState<GeminiGenerationSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [sourceIds, setSourceIds] = useState<number[]>([]);

  const editable = exam.is_editable;
  const totalQuestions = seriesList.reduce((sum, s) => sum + s.questionCount, 0);
  const allSeriesValid = seriesList.every(
    (s) => s.instructions.trim().length > 0 && s.questionCount >= 1 && s.questionTypes.length > 0,
  );

  const rawText = session?.raw_text ?? null;
  const parseResult = useMemo(() => (rawText ? parseQcmText(rawText) : null), [rawText]);
  const showPreview =
    !!rawText && !!parseResult && parseResult.questions.length > 0 && parseResult.errors.length === 0;

  const loadActiveSession = useCallback(async () => {
    setLoadingSession(true);
    try {
      const active = await api<GeminiGenerationSession | null>(
        `/api/exams/${examId}/gemini-sessions/active`,
      );
      setSession(active);
    } catch {
      setSession(null);
    } finally {
      setLoadingSession(false);
    }
  }, [examId]);

  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  const addSeries = () => setSeriesList((prev) => [...prev, createGeminiQuestionSeries()]);
  const updateSeries = (id: string, next: GeminiQuestionSeriesDraft) => {
    setSeriesList((prev) => prev.map((s) => (s.id === id ? next : s)));
  };
  const removeSeries = (id: string) => {
    setSeriesList((prev) => prev.filter((s) => s.id !== id));
  };

  const resetSession = async () => {
    if (session) {
      try {
        await api(`/api/gemini-sessions/${session.id}/abandon`, { method: "POST" });
      } catch {
        /* ignore */
      }
    }
    setSession(null);
  };

  const startSession = async () => {
    setGenerating(true);
    onError("");
    try {
      if (session) {
        await api(`/api/gemini-sessions/${session.id}/abandon`, { method: "POST" });
      }
      const created = await api<GeminiGenerationSession>(`/api/exams/${examId}/gemini-sessions`, {
        method: "POST",
        body: JSON.stringify({
          series: seriesListToApiPayload(seriesList),
          source_ids: sourceIds,
        }),
      });
      setSession(created);
    } catch (e) {
      onError(resolveGeminiApiError(e));
    } finally {
      setGenerating(false);
    }
  };

  const refineSession = async (message: string) => {
    if (!session) return;
    setRefining(true);
    onError("");
    try {
      const updated = await api<GeminiGenerationSession>(
        `/api/gemini-sessions/${session.id}/messages`,
        { method: "POST", body: JSON.stringify({ message }) },
      );
      setSession(updated);
    } catch (e) {
      onError(resolveGeminiApiError(e));
    } finally {
      setRefining(false);
    }
  };

  const acceptDraft = async () => {
    if (!parseResult || parseResult.questions.length === 0 || !session) return;
    setAccepting(true);
    onError("");
    try {
      const questionsLanguage = seriesList[0]?.language ?? "he";
      const res = await api<{ imported_count: number }>(
        `/api/gemini-sessions/${session.id}/accept`,
        {
          method: "POST",
          body: JSON.stringify({
            questions: toImportPayload(parseResult.questions),
            questions_language: questionsLanguage,
          }),
        },
      );
      onSuccess(`${he.importSuccess}: ${res.imported_count} ${he.questionsImported}`);
      setSession(null);
      await onImported();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    await resetSession();
  };

  if (loadingSession) {
    return (
      <Box display="flex" justifyContent="center" py={3}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box dir="rtl">
      <Typography variant="body2" color="text.secondary" paragraph sx={hebrewAlignRightSx}>
        {he.geminiGenerateIntro}
      </Typography>
      {!editable && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {he.examNotEditable}
        </Alert>
      )}
      {!showPreview && (
        <ExamGeminiSourcesPanel
          examId={examId}
          disabled={!editable || generating || refining}
          onSelectedIdsChange={setSourceIds}
          onError={onError}
        />
      )}
      {!showPreview &&
        seriesList.map((series, index) => (
          <GeminiQuestionSeriesCard
            key={series.id}
            index={index}
            series={series}
            canRemove={seriesList.length > 1}
            disabled={!editable || generating || refining}
            onChange={(next) => updateSeries(series.id, next)}
            onRemove={() => removeSeries(series.id)}
          />
        ))}
      {!showPreview && (
        <>
          <Box sx={{ ...hebrewActionsBarRtlSx, mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={addSeries}
              disabled={!editable || generating || refining}
            >
              {he.geminiAddSeries}
            </Button>
            <DisabledActionTooltip
              disabled={!editable || !allSeriesValid || generating || refining}
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
                startIcon={
                  generating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />
                }
                onClick={startSession}
                disabled={generating}
              >
                {generating ? he.geminiGenerating : he.geminiGenerateQuestions}
              </Button>
            </DisabledActionTooltip>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, ...hebrewAlignRightSx }}>
            {he.geminiSeriesTotalQuestions}: {totalQuestions}
          </Typography>
        </>
      )}
      {rawText && parseResult && parseResult.errors.length > 0 && session && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {he.geminiParseFailedTitle}
            </Typography>
            <Typography variant="body2" paragraph sx={{ mb: 1 }}>
              {he.geminiParseFailedHint}
            </Typography>
            <Box component="ul" sx={{ m: 0, pr: 2.5 }}>
              {parseResult.errors.map((e) => (
                <Typography key={`${e.block}-${e.message}`} component="li" variant="body2">
                  <strong>{geminiParseErrorLocation(e.block)}:</strong> {geminiParseErrorDetail(e)}
                </Typography>
              ))}
            </Box>
          </Alert>
          <GeminiRefinePanel
            messages={session.messages}
            refining={refining}
            disabled={!editable || accepting}
            onSend={refineSession}
          />
          <Button size="small" onClick={handleReject} sx={{ mt: 1 }} disabled={refining}>
            {he.geminiRejectQuestions}
          </Button>
        </Box>
      )}
      {showPreview && parseResult && session && (
        <>
          <GeminiGeneratedQuestionsPreview
            questions={parseResult.questions}
            accepting={accepting}
            editable={editable}
            onAccept={acceptDraft}
            onReject={handleReject}
          />
          <GeminiRefinePanel
            messages={session.messages}
            refining={refining}
            disabled={!editable || accepting}
            onSend={refineSession}
          />
          <Button size="small" onClick={handleReject} sx={{ mt: 1 }} disabled={accepting || refining}>
            {he.geminiStartOver}
          </Button>
        </>
      )}
    </Box>
  );
}

function resolveGeminiApiError(e: unknown): string {
  if (!(e instanceof ApiError)) return he.errorGeneric;
  const msg = e.message.toLowerCase();
  if (msg.includes("מכסת gemini") || msg.includes("quota")) {
    return he.geminiQuotaExceeded;
  }
  if (msg.includes("עמוס") || msg.includes("busy") || msg.includes("429")) {
    return he.geminiServiceBusy;
  }
  return e.message;
}
