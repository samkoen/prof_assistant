import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, LinearProgress, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import GeminiGeneratedQuestionsPreview from "./GeminiGeneratedQuestionsPreview";
import GeminiQuestionSeriesCard from "./GeminiQuestionSeriesCard";
import ExamGeminiSourcesPanel from "./ExamGeminiSourcesPanel";
import GeminiRefinePanel from "./GeminiRefinePanel";
import GeminiPromptTransparencyPanel from "./GeminiPromptTransparencyPanel";
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
import { logGeminiPrompt } from "../utils/geminiSessionDebug";
import {
  fetchRemainingGeminiBatches,
  isGeminiTimeoutError,
  refreshGeminiSession,
  resolveGeminiApiError,
} from "../utils/geminiBatchGeneration";
import { seriesListToApiPayload } from "../utils/geminiSeriesApi";
import { isLowTopicOverlap } from "../utils/geminiTopicOverlap";
import type { GeminiGenerationPreview } from "../types/geminiGenerationPreview";
import { hebrewActionsBarRtlSx, hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

interface ExamEditorGeminiGenerationSectionProps {
  examId: number;
  exam: ExamDetail;
  onImported: () => void | Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onParseFailed?: (rawText: string) => void;
}

export default function ExamEditorGeminiGenerationSection({
  examId,
  exam,
  onImported,
  onSuccess,
  onError,
  onParseFailed,
}: ExamEditorGeminiGenerationSectionProps) {
  const lastForwardedRawRef = useRef<string | null>(null);
  const lastReportedRawRef = useRef<string | null>(null);
  const [seriesList, setSeriesList] = useState<GeminiQuestionSeriesDraft[]>(() => [
    createGeminiQuestionSeries(),
  ]);
  const [session, setSession] = useState<GeminiGenerationSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [sourceIds, setSourceIds] = useState<number[]>([]);
  const [batchError, setBatchError] = useState<{ message: string; timeout: boolean } | null>(
    null,
  );
  const [previewStep, setPreviewStep] = useState(false);
  const [previewData, setPreviewData] = useState<GeminiGenerationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const editable = exam.is_editable;
  const totalQuestions = seriesList.reduce((sum, s) => sum + s.questionCount, 0);
  const allSeriesValid = seriesList.every(
    (s) => s.instructions.trim().length > 0 && s.questionCount >= 1 && s.questionTypes.length > 0,
  );

  const rawText = session?.raw_text ?? null;
  const generationComplete = session?.generation_progress?.complete ?? true;
  const batchProgress = session?.generation_progress;
  const parseResult = useMemo(() => (rawText ? parseQcmText(rawText) : null), [rawText]);
  const parsedQuestions =
    parseResult && parseResult.errors.length === 0 ? parseResult.questions : [];
  const showQuestionPreview = parsedQuestions.length > 0 && !!session;
  const showFullPreview = showQuestionPreview && generationComplete;
  const showPartialPreview = showQuestionPreview && !generationComplete;
  const generationStarted =
    !!session && (generating || !!rawText || (!!batchProgress && !batchProgress.complete));
  const showBatchProgress =
    !!batchProgress && !batchProgress.complete && (generating || !!batchError);
  const canContinueGeneration =
    !!session &&
    !!batchProgress &&
    !batchProgress.complete &&
    !generating &&
    editable;

  const instructionTexts = previewData?.instructions ?? seriesList.map((s) => s.instructions.trim());
  const topicMismatch =
    !!rawText &&
    parsedQuestions.length > 0 &&
    isLowTopicOverlap(instructionTexts, parsedQuestions.map((q) => q.text));
  const generationWarnings = session?.generation_warnings ?? [];
  const showDuplicateWarnings =
    generationWarnings.length > 0 && (showPartialPreview || showFullPreview);

  const continueIncompleteSession = useCallback(
    async (current: GeminiGenerationSession) => {
      if (!current.generation_progress || current.generation_progress.complete) return current;
      setGenerating(true);
      setBatchError(null);
      onError("");
      try {
        const finished = await fetchRemainingGeminiBatches(current, (updated) => {
          setSession(updated);
        });
        setSession(finished);
        return finished;
      } catch (e) {
        try {
          const refreshed = await refreshGeminiSession(current.id);
          setSession(refreshed);
        } catch {
          setSession(current);
        }
        const message = resolveGeminiApiError(e);
        const timeout = isGeminiTimeoutError(e);
        setBatchError({ message, timeout });
        onError(message);
        return current;
      } finally {
        setGenerating(false);
      }
    },
    [onError],
  );

  const loadActiveSession = useCallback(async () => {
    setLoadingSession(true);
    try {
      const active = await api<GeminiGenerationSession | null>(
        `/api/exams/${examId}/gemini-sessions/active`,
      );
      setSession(active);
      if (active?.generation_progress && !active.generation_progress.complete) {
        await continueIncompleteSession(active);
      }
    } catch {
      setSession(null);
    } finally {
      setLoadingSession(false);
    }
  }, [examId, continueIncompleteSession]);

  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  useEffect(() => {
    if (!rawText || !parseResult || parseResult.errors.length === 0 || !session) return;
    if (!generationComplete) return;
    if (lastForwardedRawRef.current === rawText) return;
    lastForwardedRawRef.current = rawText;
    logGeminiPrompt(session.messages);
    onParseFailed?.(rawText);
    if (lastReportedRawRef.current !== rawText) {
      lastReportedRawRef.current = rawText;
      void api(`/api/gemini-sessions/${session.id}/report-parse-error`, {
        method: "POST",
        body: JSON.stringify({ errors: parseResult.errors }),
      }).catch(() => {});
    }
  }, [rawText, parseResult, session, generationComplete, onParseFailed]);

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
    setBatchError(null);
    setPreviewStep(false);
    setPreviewData(null);
  };

  const requestPreview = async () => {
    setLoadingPreview(true);
    onError("");
    try {
      const preview = await api<GeminiGenerationPreview>(
        `/api/exams/${examId}/gemini-sessions/preview`,
        {
          method: "POST",
          body: JSON.stringify({
            series: seriesListToApiPayload(seriesList),
            source_ids: sourceIds,
          }),
        },
      );
      setPreviewData(preview);
      setPreviewStep(true);
    } catch (e) {
      onError(resolveGeminiApiError(e));
    } finally {
      setLoadingPreview(false);
    }
  };

  const cancelPreview = () => {
    setPreviewStep(false);
    setPreviewData(null);
  };

  const startSession = async () => {
    setGenerating(true);
    setBatchError(null);
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
      if (created.generation_progress && !created.generation_progress.complete) {
        await continueIncompleteSession(created);
      }
    } catch (e) {
      const message = resolveGeminiApiError(e);
      setBatchError({ message, timeout: isGeminiTimeoutError(e) });
      onError(message);
    } finally {
      setGenerating(false);
    }
  };

  const refineSession = async (message: string) => {
    if (!session) return;
    setRefining(true);
    setBatchError(null);
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
    if (!parseResult || parseResult.questions.length === 0 || !session || !generationComplete) {
      return;
    }
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
      setBatchError(null);
      setPreviewStep(false);
      setPreviewData(null);
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
      {!generationStarted && !previewStep && (
        <ExamGeminiSourcesPanel
          examId={examId}
          disabled={!editable || generating || refining}
          onSelectedIdsChange={setSourceIds}
          onError={onError}
        />
      )}
      {!generationStarted && !previewStep &&
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
      {!generationStarted && !previewStep && (
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
              disabled={!editable || !allSeriesValid || generating || refining || loadingPreview}
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
                  loadingPreview ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <AutoAwesomeIcon />
                  )
                }
                onClick={requestPreview}
                disabled={loadingPreview || generating}
              >
                {loadingPreview ? he.geminiPreviewLoading : he.geminiGenerateQuestions}
              </Button>
            </DisabledActionTooltip>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, ...hebrewAlignRightSx }}>
            {he.geminiSeriesTotalQuestions}: {totalQuestions}
          </Typography>
        </>
      )}

      {previewStep && previewData && !generationStarted && (
        <Box sx={{ mb: 2 }}>
          <GeminiPromptTransparencyPanel
            instructions={previewData.instructions}
            sources={previewData.sources}
            defaultExpanded
          />
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={hebrewAlignRightSx}>
              {he.geminiPreviewSummaryTitle}
            </Typography>
            <Typography variant="body2" sx={hebrewAlignRightSx}>
              {previewData.ai_summary}
            </Typography>
          </Alert>
          <Box sx={{ ...hebrewActionsBarRtlSx }}>
            <Button variant="outlined" onClick={cancelPreview} disabled={generating}>
              {he.geminiPreviewCorrect}
            </Button>
            <Button
              variant="contained"
              startIcon={
                generating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />
              }
              onClick={() => {
                setPreviewStep(false);
                void startSession();
              }}
              disabled={generating}
            >
              {generating ? he.geminiGenerating : he.geminiPreviewConfirm}
            </Button>
          </Box>
        </Box>
      )}

      {previewData && generationStarted && (
        <GeminiPromptTransparencyPanel
          instructions={previewData.instructions}
          sources={previewData.sources}
        />
      )}

      {topicMismatch && (showPartialPreview || showFullPreview) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={hebrewAlignRightSx}>
            {he.geminiTopicMismatch}
          </Typography>
        </Alert>
      )}

      {showDuplicateWarnings && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={hebrewAlignRightSx}>
            {he.geminiDuplicateWarningsTitle}
          </Typography>
          <Box component="ul" sx={{ m: 0, pr: 2.5 }}>
            {generationWarnings.map((warning) => (
              <Typography key={warning} component="li" variant="body2" sx={hebrewAlignRightSx}>
                {warning}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}

      {batchError && (
        <Alert severity={batchError.timeout ? "error" : "warning"} sx={{ mb: 2 }}>
          <Typography variant="body2">{batchError.message}</Typography>
          {canContinueGeneration && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => session && void continueIncompleteSession(session)}
              >
                {he.geminiContinueGeneration}
              </Button>
              <Button size="small" color="inherit" onClick={() => void handleReject()}>
                {he.geminiStartOver}
              </Button>
            </Box>
          )}
        </Alert>
      )}

      {showBatchProgress && batchProgress && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, ...hebrewAlignRightSx }}>
            {he.geminiBatchProgress(
              batchProgress.generated_questions,
              batchProgress.total_questions,
              Math.min(batchProgress.completed_batches + 1, batchProgress.total_batches),
              batchProgress.total_batches,
            )}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={
              batchProgress.total_questions > 0
                ? (batchProgress.generated_questions / batchProgress.total_questions) * 100
                : 0
            }
          />
        </Box>
      )}

      {showPartialPreview && (
        <GeminiGeneratedQuestionsPreview
          questions={parsedQuestions}
          accepting={accepting}
          editable={editable}
          partial
          onAccept={acceptDraft}
          onReject={handleReject}
        />
      )}

      {rawText && parseResult && parseResult.errors.length > 0 && session && generationComplete && (
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

      {showFullPreview && session && (
        <>
          <GeminiGeneratedQuestionsPreview
            questions={parsedQuestions}
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
