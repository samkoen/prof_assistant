import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import GeminiRefinePanel from "./GeminiRefinePanel";
import { api } from "../api/client";
import type { GeminiGenerationSession } from "../types/geminiQuestionSeries";
import type { ParseError } from "../utils/qcmImportParser";
import {
  GEMINI_FIX_STARS_REFINE_MESSAGE,
  parseErrorsNeedStarFix,
} from "../utils/geminiParseErrors";
import { resolveGeminiApiError } from "../utils/geminiBatchGeneration";
import { hebrewActionsBarRtlSx, hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

type Props = {
  examId: number;
  errors: ParseError[];
  editable: boolean;
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
        setSession(updated);
        if (updated.raw_text) onRawText(updated.raw_text);
        onSuccess(he.geminiRefineApplied);
      } catch (e) {
        onError(resolveGeminiApiError(e));
      } finally {
        setRefining(false);
      }
    },
    [session, onRawText, onError, onSuccess],
  );

  if (errors.length === 0 || loadingSession || !session) return null;

  const showStarQuickFix = parseErrorsNeedStarFix(errors);

  return (
    <Box sx={{ mb: 2 }} dir="rtl">
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={hebrewAlignRightSx}>
          {he.pasteGeminiFixTitle}
        </Typography>
        <Typography variant="body2" sx={hebrewAlignRightSx}>
          {he.pasteGeminiFixHint}
        </Typography>
      </Alert>
      {showStarQuickFix && (
        <Box sx={{ ...hebrewActionsBarRtlSx, mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoFixHighIcon />}
            disabled={!editable || refining}
            onClick={() => void refineSession(GEMINI_FIX_STARS_REFINE_MESSAGE)}
          >
            {he.pasteGeminiFixStarsQuick}
          </Button>
        </Box>
      )}
      <GeminiRefinePanel
        messages={session.messages}
        refining={refining}
        disabled={!editable}
        onSend={(message) => void refineSession(message)}
      />
    </Box>
  );
}
