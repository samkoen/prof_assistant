import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { GeminiGenerationSession } from "../types/geminiQuestionSeries";
import type { ParseError } from "../utils/qcmImportParser";
import {
  buildAutoStructureFixPrompt,
  canAutoFixStructure,
  MAX_AUTO_STRUCTURE_FIX_ATTEMPTS,
} from "../utils/geminiAutoStructureFix";
import { resolveGeminiApiError } from "../utils/geminiBatchGeneration";

type Options = {
  session: GeminiGenerationSession | null;
  errors: ParseError[];
  rawText: string | null;
  enabled: boolean;
  onSessionUpdate: (session: GeminiGenerationSession) => void;
  onError: (message: string) => void;
  onRawText?: (text: string) => void;
};

function errorsSignature(errors: ParseError[]): string {
  return errors.map((e) => `${e.block}:${e.message}`).join("|");
}

/**
 * Si le parse échoue avec des erreurs classifiables, envoie automatiquement
 * un prompt de correction à Gemini (sans bouton). Max N essais par session.
 */
export function useGeminiAutoStructureFix({
  session,
  errors,
  rawText,
  enabled,
  onSessionUpdate,
  onError,
  onRawText,
}: Options): { autoFixing: boolean } {
  const [autoFixing, setAutoFixing] = useState(false);
  const attemptsRef = useRef(0);
  const lastTriedRawRef = useRef<string | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const errorsRef = useRef(errors);
  const callbacksRef = useRef({ onSessionUpdate, onError, onRawText });

  errorsRef.current = errors;
  callbacksRef.current = { onSessionUpdate, onError, onRawText };

  if (session?.id !== sessionIdRef.current) {
    sessionIdRef.current = session?.id ?? null;
    attemptsRef.current = 0;
    lastTriedRawRef.current = null;
  }

  const errorKey = errorsSignature(errors);
  const sessionId = session?.id ?? null;

  useEffect(() => {
    const currentErrors = errorsRef.current;
    if (!enabled || !sessionId || !rawText || currentErrors.length === 0) return;
    if (!canAutoFixStructure(currentErrors)) return;
    if (attemptsRef.current >= MAX_AUTO_STRUCTURE_FIX_ATTEMPTS) return;
    if (lastTriedRawRef.current === rawText) return;

    const prompt = buildAutoStructureFixPrompt(currentErrors);
    if (!prompt) return;

    let cancelled = false;
    lastTriedRawRef.current = rawText;
    attemptsRef.current += 1;
    setAutoFixing(true);
    callbacksRef.current.onError("");

    void (async () => {
      try {
        const updated = await api<GeminiGenerationSession>(
          `/api/gemini-sessions/${sessionId}/messages`,
          { method: "POST", body: JSON.stringify({ message: prompt }) },
        );
        if (cancelled) return;
        callbacksRef.current.onSessionUpdate(updated);
        if (updated.raw_text) callbacksRef.current.onRawText?.(updated.raw_text);
      } catch (e) {
        if (!cancelled) callbacksRef.current.onError(resolveGeminiApiError(e));
      } finally {
        setAutoFixing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, sessionId, rawText, errorKey]);

  return { autoFixing };
}
