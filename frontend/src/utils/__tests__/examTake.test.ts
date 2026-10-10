import { describe, expect, it } from "vitest";
import { answersFromSaved, buildAnswersPayload, formatRemaining, msUntil, textsFromSaved, timerLevel, unansweredCount } from "../examTake";

const NOW = Date.parse("2026-01-01T10:00:00Z");
const at = (ms: number) => new Date(NOW + ms).toISOString();

describe("réponses sauvegardées", () => {
  const saved = [
    { question_id: 1, selected_option_ids: [4, 5], text_answer: null },
    { question_id: 2, selected_option_ids: [], text_answer: "réponse" },
  ] as never;
  it("reconstitue choix et textes", () => {
    expect(answersFromSaved(saved)).toEqual({ 1: [4, 5], 2: [] });
    expect(textsFromSaved(saved)).toEqual({ 2: "réponse" });
  });
  it("gère l'absence de brouillon", () => {
    expect(answersFromSaved(undefined as never)).toEqual({});
  });
});

describe("buildAnswersPayload", () => {
  it("envoie le texte seulement pour les questions ouvertes", () => {
    const qs = [
      { id: 1, question_type: "single" },
      { id: 2, question_type: "open" },
    ] as never;
    const payload = buildAnswersPayload(qs, { 1: [9] }, { 2: "abc" });
    expect(payload.answers).toEqual([
      { question_id: 1, selected_option_ids: [9], text_answer: null },
      { question_id: 2, selected_option_ids: [], text_answer: "abc" },
    ]);
  });
});

describe("minuteur", () => {
  it("formate en MM:SS et borne à zéro", () => {
    expect(formatRemaining(at(65_000), NOW)).toBe("01:05");
    expect(formatRemaining(at(-5_000), NOW)).toBe("00:00");
    expect(formatRemaining(null, NOW)).toBe("—");
  });
  it("msUntil renvoie null sans échéance", () => {
    expect(msUntil(null)).toBeNull();
    expect(msUntil(at(1000), NOW)).toBe(1000);
  });
  it("calcule le niveau d'urgence", () => {
    expect(timerLevel(null, 5)).toBe("normal");
    expect(timerLevel(30 * 60_000, 5)).toBe("normal");
    expect(timerLevel(4 * 60_000, 5)).toBe("warning");
    expect(timerLevel(45_000, 5)).toBe("critical");
  });
});

describe("unansweredCount", () => {
  it("ne descend jamais sous zéro", () => {
    expect(unansweredCount(10, 7)).toBe(3);
    expect(unansweredCount(2, 5)).toBe(0);
  });
});
