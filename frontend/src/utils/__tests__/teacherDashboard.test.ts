import { describe, expect, it } from "vitest";
import type { ExamSession } from "../../api/client";
import { he } from "../../i18n/he";
import {
  countSessions,
  creditsAreLow,
  dashboardHeadline,
  firstName,
  greetingFor,
  needsOnboarding,
  onboardingSteps,
  recentSessions,
} from "../teacherDashboard";

function session(patch: Partial<ExamSession>): ExamSession {
  return {
    id: 1,
    exam_id: 1,
    offering_id: 1,
    exam_title: "מבחן",
    catalog_name: "קורס",
    group_name: "א",
    academic_year: 2026,
    semester: 1,
    status: "draft",
    activated_at: null,
    closed_at: null,
    results_published: false,
    integrity_mode_enabled: false,
    question_count: 3,
    ...patch,
  };
}

describe("countSessions", () => {
  it("compte par état et ignore la pratique", () => {
    const counts = countSessions([
      session({ id: 1, status: "active" }),
      session({ id: 2, status: "draft" }),
      session({ id: 3, status: "closed", results_published: false }),
      session({ id: 4, status: "closed", results_published: true }),
      session({ id: 5, status: "active", is_tirgoul: true }),
    ]);
    expect(counts).toEqual({ active: 1, draft: 1, awaitingPublish: 1, finished: 1 });
  });
});

describe("textes du tableau de bord", () => {
  it("garde le prénom et choisit le bon moment de la journée", () => {
    expect(firstName("  דנה לוי ")).toBe("דנה");
    expect(greetingFor(8)).toBe(he.greetingMorning);
    expect(greetingFor(14)).toBe(he.greetingAfternoon);
    expect(greetingFor(20)).toBe(he.greetingEvening);
    expect(greetingFor(2)).toBe(he.greetingNight);
  });

  it("résume ce qui demande l'attention, sinon confirme que tout est à jour", () => {
    expect(dashboardHeadline({ pending: 0, active: 0, awaitingPublish: 0 })).toBe(he.headlineAllClear);
    const text = dashboardHeadline({ pending: 2, active: 1, awaitingPublish: 1 });
    expect(text).toContain(he.headlinePending(2));
    expect(text).toContain(he.headlineAwaitingPublish(1));
    expect(text).toContain(he.headlineActive(1));
  });
});

describe("premiers pas", () => {
  it("détecte les étapes terminées", () => {
    const steps = onboardingSteps({ catalogs: 1, offerings: 0, sessions: 0 });
    expect(steps.map((s) => s.done)).toEqual([true, false, false]);
    expect(needsOnboarding({ catalogs: 1, offerings: 1, sessions: 1 })).toBe(false);
    expect(needsOnboarding({ catalogs: 0, offerings: 0, sessions: 0 })).toBe(true);
  });
});

describe("recentSessions et crédits", () => {
  it("trie par activité récente puis par identifiant", () => {
    const rows = recentSessions(
      [
        session({ id: 1, activated_at: "2026-01-01T10:00:00Z" }),
        session({ id: 2, activated_at: "2026-03-01T10:00:00Z" }),
        session({ id: 3 }),
      ],
      2,
    );
    expect(rows.map((r) => r.id)).toEqual([2, 1]);
  });

  it("alerte quand il reste au plus un crédit, jamais en illimité", () => {
    expect(creditsAreLow(1, false)).toBe(true);
    expect(creditsAreLow(4, false)).toBe(false);
    expect(creditsAreLow(0, true)).toBe(false);
  });
});
