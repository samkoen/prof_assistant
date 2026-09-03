import { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";
import GeminiAiWorkingBanner from "./GeminiAiWorkingBanner";
import { useGeminiAutoStructureFix } from "../hooks/useGeminiAutoStructureFix";
import { api } from "../api/client";
import type { GeminiGenerationSession } from "../types/geminiQuestionSeries";
import type { ParseError } from "../utils/qcmImportParser";
import { he } from "../i18n/he";

type Props = {
  examId: number;
  errors: ParseError[];
  editable: boolean;
  pasteText: string;
  onRawText: (text: string) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
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
  onBusyChange,
}: Props) {
  const [session, setSession] = useState<GeminiGenerationSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

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
    enabled: editable && !loadingSession && errors.length > 0,
    onSessionUpdate: handleSessionUpdate,
    onError,
    onRawText,
  });

  useEffect(() => {
    onBusyChange?.(autoFixing);
  }, [autoFixing, onBusyChange]);

  if (!autoFixing) return null;

  return (
    <Box sx={{ mb: 2 }} dir="rtl">
      <GeminiAiWorkingBanner message={he.geminiAutoFixingFormat} />
    </Box>
  );
}
