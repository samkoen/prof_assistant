import { describe, expect, it } from "vitest";
import type { ExamSection } from "../../api/client";
import {
  answerProgress,
  effectiveRequired,
  examMaxPoints,
  findNextAnswerableIndex,
  groupMaxPoints,
  groupQuestionsBySection,
  lockedQuestionIds,
  moveWithinGroup,
  parseRequiredCount,
  parseScoreCap,
  uncountedReviewKind,
} from "../examSections";

const PART_A: ExamSection = { id: 1, title: "חלק א'", instructions: null, order_index: 0, required_count: null };
const PART_B: ExamSection = { id: 2, title: "חלק ב'", instructions: null, order_index: 1, required_count: 6 };
const SECTIONS = [PART_B, PART_A];

/** Sujet type : 1 question ouverte de 60 points, puis 7 QCM de 7 points dont 6 comptent. */
const QUESTIONS = [
  { id: 1, section_id: 1, points: 60, question_type: "open" as const },
  ...[2, 3, 4, 5, 6, 7, 8].map((id) => ({ id, section_id: 2, points: 7, question_type: "single" as const })),
];

const answered = (ids: number[]) => ({ answers: Object.fromEntries(ids.map((id) => [id, [1]])), textAnswers: {} });

describe("groupQuestionsBySection", () => {
  it("suit l'ordre des parties et numérote sur tout le sujet", () => {
    const groups = groupQuestionsBySection(QUESTIONS, SECTIONS);
    expect(groups.map((g) => g.section?.title)).toEqual(["חלק א'", "חלק ב'"]);
    expect(groups[1].items.map((i) => i.index)).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });
  it("place d'abord les questions sans partie (ou d'une partie inconnue)", () => {
    const groups = groupQuestionsBySection([{ id: 9, section_id: 99 }, { id: 1, section_id: 1 }], SECTIONS);
    expect(groups.map((g) => g.section?.id ?? null)).toEqual([null, 1]);
  });
  it("sans partie : un seul groupe, ordre inchangé", () => {
    const groups = groupQuestionsBySection(QUESTIONS, []);
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((i) => i.question.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("barème", () => {
  it("ne compte que les N questions demandées", () => {
    const [, partB] = groupQuestionsBySection(QUESTIONS, SECTIONS);
    expect(groupMaxPoints(partB)).toBe(42);
    expect(examMaxPoints(QUESTIONS, SECTIONS)).toBe(102);
  });
  it("applique le plafond de note", () => {
    expect(examMaxPoints(QUESTIONS, SECTIONS, 100)).toBe(100);
  });
  it("ignore un N qui n'impose aucun choix", () => {
    expect(effectiveRequired(PART_B, 6)).toBeNull();
    expect(effectiveRequired(PART_B, 7)).toBe(6);
    expect(effectiveRequired(PART_A, 3)).toBeNull();
  });
});

describe("passation d'une partie « 6 sur 7 »", () => {
  it("verrouille la question restante une fois le quota atteint", () => {
    expect(lockedQuestionIds(QUESTIONS, SECTIONS, answered([2, 3, 4, 5, 6]))).toEqual(new Set());
    expect(lockedQuestionIds(QUESTIONS, SECTIONS, answered([2, 3, 4, 5, 6, 7]))).toEqual(new Set([8]));
  });
  it("compte la progression sur les réponses attendues", () => {
    const maps = { ...answered([2, 3, 4, 5, 6, 7]), textAnswers: { 1: "int series(int n)" } };
    expect(answerProgress(QUESTIONS, SECTIONS, maps)).toEqual({ required: 7, answered: 7 });
    expect(answerProgress(QUESTIONS, SECTIONS, answered([2]))).toEqual({ required: 7, answered: 1 });
  });
  it("saute les questions verrouillées pour « question suivante »", () => {
    expect(findNextAnswerableIndex(QUESTIONS, SECTIONS, answered([2, 3, 4, 5, 6, 7]), 3)).toBe(0);
    const all = { ...answered([2, 3, 4, 5, 6, 7]), textAnswers: { 1: "x" } };
    expect(findNextAnswerableIndex(QUESTIONS, SECTIONS, all, 0)).toBeNull();
  });
});

describe("correction d'une partie « N sur M »", () => {
  it("distingue la question laissée de côté de la réponse en trop", () => {
    expect(uncountedReviewKind({ counted: false, student_options: [] })).toBe("skipped");
    expect(uncountedReviewKind({ counted: false, student_text_answer: "  " })).toBe("skipped");
    expect(uncountedReviewKind({ counted: false, student_options: [{ id: 1 }] })).toBe("extra");
    expect(uncountedReviewKind({ counted: false, student_text_answer: "x" })).toBe("extra");
  });
  it("ne signale rien pour une question notée", () => {
    expect(uncountedReviewKind({ counted: true, student_options: [] })).toBeNull();
    expect(uncountedReviewKind({ student_options: [] })).toBeNull();
  });
});

describe("éditeur", () => {
  it("déplace une question seulement à l'intérieur de sa partie", () => {
    expect(moveWithinGroup(QUESTIONS, SECTIONS, 2, -1)).toBeNull();
    expect(moveWithinGroup(QUESTIONS, SECTIONS, 1, 1)).toBeNull();
    expect(moveWithinGroup(QUESTIONS, SECTIONS, 2, 1)).toEqual([1, 3, 2, 4, 5, 6, 7, 8]);
  });
  it("échange deux questions d'une même partie même si elles ne sont pas voisines dans l'ordre global", () => {
    const mixed = [{ id: 1, section_id: 2 }, { id: 2, section_id: 1 }, { id: 3, section_id: 2 }];
    expect(moveWithinGroup(mixed, SECTIONS, 1, 1)).toEqual([3, 2, 1]);
  });
  it("lit les champs numériques du professeur", () => {
    expect(parseScoreCap("100")).toBe(100);
    expect(parseScoreCap("")).toBeNull();
    expect(parseScoreCap("-5")).toBeNull();
    expect(parseRequiredCount("6")).toBe(6);
    expect(parseRequiredCount("")).toBeNull();
    expect(parseRequiredCount("2.5")).toBeNull();
  });
});
