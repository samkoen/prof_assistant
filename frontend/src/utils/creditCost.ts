/** Même règle que le découpage réel : 3 questions par appel, 2 si le sujet est lourd ou s'il y en a 12 ou plus. */

export const DEFAULT_CALLS_PER_CREDIT = 5;
const REGULAR_BATCH = 3;
const HEAVY_BATCH = 2;
const HEAVY_FROM = 12;

export function creditsForCalls(calls: number, callsPerCredit: number): number {
  if (calls <= 0) return 0;
  return Math.ceil(calls / Math.max(1, callsPerCredit));
}

export function worstCaseCalls(questions: number, heavy: boolean): number {
  if (questions <= 0) return 0;
  const batch = heavy || questions >= HEAVY_FROM ? HEAVY_BATCH : REGULAR_BATCH;
  return Math.ceil(questions / batch);
}

export type CreditAudience = "teacher" | "student" | "both";

export function creditAudience(role: string): CreditAudience {
  if (role === "teacher") return "teacher";
  if (role === "student") return "student";
  return "both";
}

export function teacherCostExamples(callsPerCredit: number) {
  const per = Math.max(1, callsPerCredit);
  return {
    typical: creditsForCalls(1, per),
    five: creditsForCalls(worstCaseCalls(5, false), per),
    twelve: creditsForCalls(worstCaseCalls(12, true), per),
    thirty: creditsForCalls(worstCaseCalls(30, true), per),
  };
}
