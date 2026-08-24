import { describe, expect, it } from "vitest";
import type { StudentQuestion } from "../../api/client";
import {
  countAnsweredQuestions,
  examQuestionElementId,
  findNextUnansweredIndex,
  isQuestionAnswered,
} from "../studentExamQuestionNav";

const questions = [
  { id: 10, question_type: "single" },
  { id: 20, question_type: "single" },
  { id: 30, question_type: "open" },
] as StudentQuestion[];

describe("studentExamQuestionNav", () => {
  it("identifie les questions répondues", () => {
    expect(isQuestionAnswered(questions[0], {}, {})).toBe(false);
    expect(isQuestionAnswered(questions[0], { 10: [] }, {})).toBe(false);
    expect(isQuestionAnswered(questions[0], { 10: [1] }, {})).toBe(true);
    expect(isQuestionAnswered(questions[2], {}, { 30: "  " })).toBe(false);
    expect(isQuestionAnswered(questions[2], {}, { 30: "תשובה" })).toBe(true);
    expect(examQuestionElementId(2)).toBe("exam-question-2");
  });

  it("compte et trouve la prochaine non répondue", () => {
    const answers = { 10: [1] };
    const texts = { 30: "ok" };
    expect(countAnsweredQuestions(questions, answers, texts)).toBe(2);
    expect(findNextUnansweredIndex(questions, answers, 0, texts)).toBe(1);
    expect(findNextUnansweredIndex(questions, { 10: [1], 20: [1] }, 0, texts)).toBeNull();
  });
});
