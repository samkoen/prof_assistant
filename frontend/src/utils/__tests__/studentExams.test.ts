import { describe, expect, it } from "vitest";
import { countStudentExams, nextExam, scorePercent, scoreTone, splitStudentSessions, studentExamView, studentHeadline } from "../studentExams";
import { he } from "../../i18n/he";

type Status = "draft" | "active" | "closed";
const session = (id: number, status: Status, attempt: Record<string, unknown> | null, extra: Record<string, unknown> = {}) =>
  ({ id, status, is_tirgoul: false, results_published: false, attempt, ...extra }) as never;
const started = { started_at: "2026-01-01", submitted_at: null, score: null, max_score: null };
const submitted = { started_at: "2026-01-01", submitted_at: "2026-01-02", score: 40, max_score: 50 };

describe("studentExamView", () => {
  it("examen actif jamais ouvert → à démarrer", () => {
    expect(studentExamView({ status: "active" } as never, null).key).toBe("todo");
  });
  it("tentative commencée → en cours, même si la session est close", () => {
    expect(studentExamView({ status: "closed" } as never, started as never).key).toBe("in_progress");
  });
  it("copie rendue sans publication → hors note", () => {
    expect(studentExamView({ status: "closed", results_published: false } as never, submitted as never).key).toBe("submitted");
  });
  it("תרגול bloqué sans note reste ouvrable", () => {
    const view = studentExamView(
      { status: "active", is_tirgoul: true, grading_locked: true } as never,
      { started_at: "2026-01-01", submitted_at: "2026-01-02", score: null, max_score: null } as never,
    );
    expect(view.key).toBe("submitted");
    expect(view.openable).toBe(true);
  });
  it("copie rendue avec résultats publiés (ou entraînement) → noté", () => {
    expect(studentExamView({ status: "closed", results_published: true } as never, submitted as never).key).toBe("graded");
    expect(studentExamView({ status: "active", is_tirgoul: true } as never, submitted as never).key).toBe("graded");
  });
  it("examen clos jamais ouvert → manqué, non ouvrable", () => {
    const v = studentExamView({ status: "closed" } as never, null);
    expect(v.key).toBe("missed");
    expect(v.openable).toBe(false);
  });
});

describe("scorePercent", () => {
  it("calcule et borne le pourcentage", () => {
    expect(scorePercent({ score: 40, max_score: 50 })).toBe(80);
    expect(scorePercent({ score: 60, max_score: 50 })).toBe(100);
  });
  it("renvoie null sans score ou sans maximum", () => {
    expect(scorePercent(null)).toBeNull();
    expect(scorePercent({ score: 3, max_score: 0 })).toBeNull();
  });
});

describe("scoreTone", () => {
  it("gradue la couleur selon le pourcentage", () => {
    expect(scoreTone(90)).toBe("success");
    expect(scoreTone(60)).toBe("info");
    expect(scoreTone(30)).toBe("warning");
  });
});

describe("tri et compteurs", () => {
  const all = [
    session(1, "closed", submitted, { results_published: true }),
    session(2, "active", null),
    session(3, "active", started),
    session(4, "closed", null),
    session(5, "active", null),
  ];
  it("met l'examen en cours d'abord, puis les plus récents à démarrer", () => {
    const { pending, done } = splitStudentSessions(all);
    expect(pending.map((s) => s.id)).toEqual([3, 5, 2]);
    expect(done.map((s) => s.id)).toEqual([1, 4]);
  });
  it("propose l'examen en cours comme prochain", () => {
    expect(nextExam(all)?.id).toBe(3);
    expect(nextExam([session(4, "closed", null)])).toBeNull();
  });
  it("compte par état", () => {
    expect(countStudentExams(all)).toEqual({ todo: 2, inProgress: 1, graded: 1, submitted: 0 });
  });
  it("résume la situation en une phrase", () => {
    expect(studentHeadline({ todo: 0, inProgress: 0, graded: 0, submitted: 0 })).toBe(he.studentHeadlineAllClear);
    expect(studentHeadline({ todo: 2, inProgress: 1, graded: 0, submitted: 0 })).toContain(he.studentHeadlineInProgress(1));
  });
});
