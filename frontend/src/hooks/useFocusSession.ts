import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { examSessionRowId, parseFocusSessionId } from "../utils/studentCourseExamsNav";

const SCROLL_DELAY_MS = 80;
const HIGHLIGHT_MS = 3000;

function scrollToSession(sessionId: number) {
  document.getElementById(examSessionRowId(sessionId))?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Lit `?focusSession=` : fait défiler jusqu'à l'examen, le met en évidence 3 s,
 * puis retire le paramètre de l'URL. Retourne l'identifiant en surbrillance.
 */
export function useFocusSession(sessionIds: number[], loading: boolean, onFocus?: (sessionId: number) => void): number | null {
  const [params, setParams] = useSearchParams();
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const focusId = parseFocusSessionId(params.get("focusSession"));
  const present = focusId !== null && sessionIds.includes(focusId);

  useEffect(() => {
    if (!focusId || loading || !present) return;
    setHighlighted(focusId);
    onFocusRef.current?.(focusId);
    timers.current.push(window.setTimeout(() => scrollToSession(focusId), SCROLL_DELAY_MS));
    timers.current.push(window.setTimeout(() => setHighlighted(null), HIGHLIGHT_MS));
    const next = new URLSearchParams(params);
    next.delete("focusSession");
    setParams(next, { replace: true });
  }, [focusId, loading, present, params, setParams]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  return highlighted;
}
