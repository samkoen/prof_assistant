import { useEffect, useState } from "react";
import { formatRemaining, msUntil, timerLevel, type TimerLevel } from "../../utils/examTake";
import type { ExamActions } from "./useExamActions";
import type { ExamLoader } from "./useExamLoader";

type TimerState = { timeLeft: string; level: TimerLevel; warning: boolean; visible: boolean };

/** Décompte à la seconde de l'examen officiel (le minuteur d'un entraînement n'est pas affiché). */
function useTick(expiresAt: string | null | undefined, stopped: boolean): string {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!expiresAt || stopped) return;
    const tick = () => setTimeLeft(formatRemaining(expiresAt));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, stopped]);
  return timeLeft;
}

/** Remise automatique à l'échéance quand le professeur l'a activée. */
function useAutoSubmit(loader: ExamLoader, actions: ExamActions, rulesPending: boolean) {
  const { paper, attempt, phase } = loader;
  const { submitting, submit } = actions;
  const expiresAt = attempt?.expires_at;
  const submitted = attempt?.submitted_at;
  const auto = paper?.auto_submit_on_timeout;
  const sessionId = paper?.session_id;

  useEffect(() => {
    if (phase !== "exam" || !auto || !expiresAt || submitted || submitting || rulesPending) return;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) {
      void submit(true);
      return;
    }
    const timer = window.setTimeout(() => void submit(true), ms);
    return () => window.clearTimeout(timer);
  }, [expiresAt, submitted, submitting, phase, sessionId, auto, rulesPending, submit]);
}

/** État du minuteur affiché (temps restant, urgence) + remise automatique à l'échéance. */
export function useExamTimer(loader: ExamLoader, actions: ExamActions, rulesPending: boolean): TimerState {
  const { paper, attempt, phase } = loader;
  const timeLeft = useTick(attempt?.expires_at, Boolean(attempt?.submitted_at));
  useAutoSubmit(loader, actions, rulesPending);

  const ms = msUntil(attempt?.expires_at ?? null);
  const level = timerLevel(ms, paper?.warning_minutes ?? 0);
  const inExam = phase === "exam" && !rulesPending && Boolean(paper) && ms !== null;
  const visible = Boolean(inExam && attempt?.started_at && !paper?.is_tirgoul);
  const warnMs = (paper?.warning_minutes ?? 0) * 60_000;
  const warning = Boolean(inExam && ms !== null && ms > 0 && ms <= warnMs);
  return { timeLeft, level, warning, visible };
}

export function useTabHidden(active: boolean): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!active) return;
    const sync = () => setHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [active]);
  return hidden;
}
