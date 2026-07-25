import { describe, expect, it } from "vitest";
import type { StudentQuestion } from "../../api/client";
import {
  countAnsweredQuestions,
  examQuestionElementId,
  findNextUnansweredIndex,
  isQuestionAnswered,
} from "../studentExamQuestionNav";

const questions = [
  { id: 10 },
  { id: 20 },
  { id: 30 },
] as StudentQuestion[];

describe("studentExamQuestionNav", () => {
  it("identifie les questions répondues", () => {
    expect(isQuestionAnswered({}, 10)).toBe(false);
    expect(isQuestionAnswered({ 10: [] }, 10)).toBe(false);
    expect(isQuestionAnswered({ 10: [1] }, 10)).toBe(true);
    expect(examQuestionElementId(2)).toBe("exam-question-2");
  });

  it("compte et trouve la prochaine non répondue", () => {
    const answers = { 10: [1], 30: [2] };
    expect(countAnsweredQuestions(questions, answers)).toBe(2);
    expect(findNextUnansweredIndex(questions, answers, 0)).toBe(1);
    expect(findNextUnansweredIndex(questions, answers, 1)).toBe(1);
    expect(findNextUnansweredIndex(questions, { 10: [1], 20: [1], 30: [1] }, 0)).toBeNull();
  });
});
