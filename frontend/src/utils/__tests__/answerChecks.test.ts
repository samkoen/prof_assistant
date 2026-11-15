import { describe, expect, it } from "vitest";
import type { GeminiAnswerCheck } from "../../types/geminiQuestionSeries";
import { applyResolutions, canUseChecked, checkFor, pendingMismatches, summarizeChecks } from "../answerChecks";
import { parseQcmText, type ParsedQuestion } from "../qcmImportParser";

const RAW = `---
Q1 [single] (1 pt)
2 + 2 = ?
A) 3
B) 4 *
---
Q2 [single] (1 pt)
3 * 3 = ?
A) 6 *
B) 9
---
Q3 [open] (2 pt)
הסבירו.`;

function check(q_num: number, status: GeminiAnswerCheck["status"], generated: string[], checked: string[]): GeminiAnswerCheck {
  return { q_num, status, generated, checked, reason: "", solution: "", computed: false };
}

const questions: ParsedQuestion[] = parseQcmText(RAW).questions;
const checks = [check(1, "verified", ["B"], ["B"]), check(2, "mismatch", ["A"], ["B"])];

describe("parseQcmText q_num", () => {
  it("garde le numéro d'en-tête de chaque question", () => {
    expect(questions.map((q) => q.q_num)).toEqual([1, 2, 3]);
  });
});

describe("checkFor", () => {
  it("rattache la vérification par numéro et ignore les questions ouvertes", () => {
    expect(checkFor(questions[1], checks)?.status).toBe("mismatch");
    expect(checkFor(questions[2], [check(3, "verified", [], [])])).toBeUndefined();
  });
});

describe("pendingMismatches", () => {
  it("bloque tant que le prof n'a pas tranché", () => {
    expect(pendingMismatches(questions, checks, {})).toEqual([2]);
    expect(pendingMismatches(questions, checks, { 2: "generated" })).toEqual([]);
  });
});

describe("applyResolutions", () => {
  it("remplace la bonne réponse seulement si le prof choisit la vérification", () => {
    const kept = applyResolutions(questions, checks, { 2: "generated" });
    expect(kept[1].options.map((o) => o.is_correct)).toEqual([true, false]);
    const fixed = applyResolutions(questions, checks, { 2: "checked" });
    expect(fixed[1].options.map((o) => o.is_correct)).toEqual([false, true]);
    expect(fixed[0]).toBe(questions[0]);
  });

  it("n'applique pas une vérification qui ne désigne aucune option valable", () => {
    const none = [check(2, "mismatch", ["A"], [])];
    expect(canUseChecked(questions[1], none[0])).toBe(false);
    expect(applyResolutions(questions, none, { 2: "checked" })[1]).toBe(questions[1]);
  });
});

describe("summarizeChecks", () => {
  it("compte les verdicts des questions affichées", () => {
    expect(summarizeChecks(questions, checks)).toEqual({ verified: 1, mismatch: 1, unchecked: 0 });
  });
});
