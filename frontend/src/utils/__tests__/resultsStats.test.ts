import { describe, expect, it } from "vitest";
import type { StudentExamResult } from "../../api/client";
import {
  computeResultsStats,
  filterResults,
  formatPercent,
  percentOf,
  scoreDistribution,
  scoreTone,
  sortResults,
} from "../resultsStats";

let nextId = 1;
function row(patch: Partial<StudentExamResult>): StudentExamResult {
  const id = nextId++;
  return {
    student_id: id,
    student_name: `תלמיד ${id}`,
    student_number: String(1000 + id),
    attempt_id: id,
    started_at: null,
    submitted_at: null,
    score: null,
    max_score: null,
    status: "not_started",
    ...patch,
  };
}

const submitted = (score: number, max = 100, extra: Partial<StudentExamResult> = {}) =>
  row({ status: "submitted", score, max_score: max, submitted_at: "2026-03-01T10:00:00Z", ...extra });

describe("percentOf / formatPercent / scoreTone", () => {
  it("calcule le pourcentage et ignore les copies sans barème", () => {
    expect(percentOf({ score: 45, max_score: 60 })).toBe(75);
    expect(percentOf({ score: null, max_score: 60 })).toBeNull();
    expect(percentOf({ score: 10, max_score: 0 })).toBeNull();
  });

  it("formate et colore selon le niveau", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(74.6)).toBe("75%");
    expect(scoreTone(40)).toBe("danger");
    expect(scoreTone(60)).toBe("warning");
    expect(scoreTone(90)).toBe("success");
    expect(scoreTone(null)).toBe("neutral");
  });
});

describe("computeResultsStats", () => {
  it("compte les statuts et agrège seulement les copies remises", () => {
    const stats = computeResultsStats([
      submitted(80),
      submitted(40),
      row({ status: "in_progress", score: 99, max_score: 100 }),
      row({}),
    ]);
    expect(stats).toMatchObject({ total: 4, submitted: 2, inProgress: 1, notStarted: 1, graded: 2 });
    expect(stats.average).toBe(60);
    expect(stats.highest).toBe(80);
    expect(stats.lowest).toBe(40);
  });

  it("renvoie des valeurs nulles sans copie notée", () => {
    const stats = computeResultsStats([row({})]);
    expect(stats.average).toBeNull();
    expect(stats.highest).toBeNull();
  });
});

describe("scoreDistribution", () => {
  it("range les notes par tranches de 10 % avec 100 % dans la dernière", () => {
    const buckets = scoreDistribution([submitted(5), submitted(55), submitted(59), submitted(100)]);
    expect(buckets).toHaveLength(10);
    expect(buckets[0].count).toBe(1);
    expect(buckets[5].count).toBe(2);
    expect(buckets[9].count).toBe(1);
  });
});

describe("filterResults", () => {
  const rows = [submitted(80, 100, { student_name: "דנה לוי" }), row({ student_name: "יוסי כהן", student_number: "555" })];

  it("filtre par texte (nom ou numéro)", () => {
    expect(filterResults(rows, "דנה", "all")).toEqual([rows[0]]);
    expect(filterResults(rows, "555", "all")).toEqual([rows[1]]);
  });

  it("filtre par statut", () => {
    expect(filterResults(rows, "", "submitted")).toEqual([rows[0]]);
    expect(filterResults(rows, "", "not_started")).toEqual([rows[1]]);
  });
});

describe("sortResults", () => {
  const a = submitted(90, 100, { student_name: "בן" });
  const b = submitted(50, 100, { student_name: "אבי" });
  const c = row({ student_name: "גל" });

  it("trie par note et laisse les copies non notées à la fin dans les deux sens", () => {
    expect(sortResults([c, b, a], "score", "desc").map((r) => r.student_name)).toEqual(["בן", "אבי", "גל"]);
    expect(sortResults([c, a, b], "score", "asc").map((r) => r.student_name)).toEqual(["אבי", "בן", "גל"]);
  });

  it("trie par nom et ne modifie pas le tableau d'origine", () => {
    const input = [a, b, c];
    expect(sortResults(input, "name", "asc").map((r) => r.student_name)).toEqual(["אבי", "בן", "גל"]);
    expect(input).toEqual([a, b, c]);
  });
});
