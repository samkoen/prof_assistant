import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import GeminiRefinePanel from "./GeminiRefinePanel";
import { useGeminiAutoStructureFix } from "../hooks/useGeminiAutoStructureFix";
import { api } from "../api/client";
import type { GeminiGenerationSession } from "../types/geminiQuestionSeries";
import type { ParseError } from "../utils/qcmImportParser";
import { resolveGeminiApiError } from "../utils/geminiBatchGeneration";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

type Props = {
  examId: number;
  errors: ParseError[];
  editable: boolean;
  pasteText: string;
  onRawText: (text: string) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
};

async function loadActiveGeminiSession(examId: number): Promise<GeminiGenerationSession | null> {
  return api<GeminiGenerationSession | null>(`/api/exams/${examId}/gemini-sessions/active`);
}

export default function PasteGeminiRefineSection({
  examId,
  errors,
  editable,
  pasteText,
  onRawText,
  onError,
  onSuccess,
}: Props) {
  const [session, setSession] = useState<GeminiGenerationSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    if (errors.length === 0) {
      setSession(null);
      setLoadingSession(false);
      return;
    }
    let cancelled = false;
    setLoadingSession(true);
    void loadActiveGeminiSession(examId)
      .then((active) => {
        if (!cancelled) setSession(active);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, [examId, errors.length]);

  const handleSessionUpdate = useCallback(
    (updated: GeminiGenerationSession) => {
      setSession(updated);
      if (updated.raw_text) onRawText(updated.raw_text);
      onSuccess(he.geminiRefineApplied);
    },
    [onRawText, onSuccess],
  );

  const { autoFixing } = useGeminiAutoStructureFix({
    session,
    errors,
    rawText: pasteText || session?.raw_text || null,
    enabled: editable && !loadingSession && !refining && errors.length > 0,
    onSessionUpdate: handleSessionUpdate,
    onError,
    onRawText,
  });

  const refineSession = useCallback(
    async (message: string) => {
      if (!session) return;
      setRefining(true);
      onError("");
      try {
        const updated = await api<GeminiGenerationSession>(
          `/api/gemini-sessions/${session.id}/messages`,
          { method: "POST", body: JSON.stringify({ message }) },
        );
        handleSessionUpdate(updated);
      } catch (e) {
        onError(resolveGeminiApiError(e));
      } finally {
        setRefining(false);
      }
    },
    [session, onError, handleSessionUpdate],
  );

  if (errors.length === 0 || loadingSession || !session) return null;

  const busy = refining || autoFixing;

  return (
    <Box sx={{ mb: 2 }} dir="rtl">
      {autoFixing ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={hebrewAlignRightSx}>
            {he.geminiAutoFixingFormat}
          </Typography>
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={hebrewAlignRightSx}>
            {he.pasteGeminiFixTitle}
          </Typography>
          <Typography variant="body2" sx={hebrewAlignRightSx}>
            {he.pasteGeminiFixHint}
          </Typography>
        </Alert>
      )}
      <GeminiRefinePanel
        messages={session.messages}
        refining={busy}
        disabled={!editable || autoFixing}
        onSend={(message) => void refineSession(message)}
      />
    </Box>
  );
}
