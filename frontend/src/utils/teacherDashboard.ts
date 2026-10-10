import type { ExamSession } from "../api/client";
import { he } from "../i18n/he";
import { sessionStatusView } from "./examStatus";

export interface SessionCounts {
  active: number;
  draft: number;
  awaitingPublish: number;
  finished: number;
}

/** Compte les sessions d'examen (les sessions de pratique sont exclues). */
export function countSessions(sessions: ExamSession[]): SessionCounts {
  const counts: SessionCounts = { active: 0, draft: 0, awaitingPublish: 0, finished: 0 };
  for (const session of sessions) {
    const key = sessionStatusView(session).key;
    if (key === "active") counts.active += 1;
    else if (key === "draft") counts.draft += 1;
    else if (key === "awaiting_publish") counts.awaitingPublish += 1;
    else if (key === "finished") counts.finished += 1;
  }
  return counts;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return he.greetingMorning;
  if (hour >= 12 && hour < 18) return he.greetingAfternoon;
  if (hour >= 18 && hour < 22) return he.greetingEvening;
  return he.greetingNight;
}

export interface HeadlineInput {
  pending: number;
  active: number;
  awaitingPublish: number;
}

/** Phrase de synthèse : ce qui demande l'attention du prof, en une ligne. */
export function dashboardHeadline(input: HeadlineInput): string {
  const parts: string[] = [];
  if (input.pending > 0) parts.push(he.headlinePending(input.pending));
  if (input.awaitingPublish > 0) parts.push(he.headlineAwaitingPublish(input.awaitingPublish));
  if (input.active > 0) parts.push(he.headlineActive(input.active));
  return parts.length > 0 ? parts.join(" · ") : he.headlineAllClear;
}

export interface OnboardingInput {
  catalogs: number;
  offerings: number;
  sessions: number;
}

export interface OnboardingStep {
  key: "catalog" | "offering" | "exam";
  done: boolean;
}

export function onboardingSteps(input: OnboardingInput): OnboardingStep[] {
  return [
    { key: "catalog", done: input.catalogs > 0 },
    { key: "offering", done: input.offerings > 0 },
    { key: "exam", done: input.sessions > 0 },
  ];
}

export function needsOnboarding(input: OnboardingInput): boolean {
  return onboardingSteps(input).some((step) => !step.done);
}

function activityTime(session: ExamSession): number {
  const stamp = session.closed_at ?? session.activated_at;
  return stamp ? Date.parse(stamp) : 0;
}

/** Sessions les plus récentes d'abord (activité, puis identifiant). */
export function recentSessions(sessions: ExamSession[], limit: number): ExamSession[] {
  const sorted = [...sessions].sort(
    (a, b) => activityTime(b) - activityTime(a) || b.id - a.id,
  );
  return sorted.slice(0, limit);
}

/** Crédits restants jugés faibles : on alerte avant le blocage à zéro. */
export function creditsAreLow(total: number, unlimited: boolean): boolean {
  return !unlimited && total <= 1;
}
