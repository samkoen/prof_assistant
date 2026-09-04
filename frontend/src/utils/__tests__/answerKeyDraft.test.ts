import { describe, expect, it } from "vitest";
import type { Question } from "../../api/client";
import {
  answerKeyChanged,
  draftFromQuestions,
  isAnswerKeyDraftValid,
  toggleAnswerKeyOption,
} from "../answerKeyDraft";

function qcm(partial: Partial<Question> & Pick<Question, "id">): Question {
  return {
    text: "שאלה",
    question_type: "single",
    order_index: 0,
    points: 1,
    multiple_scoring_mode: null,
    options: [
      { id: 1, text: "א", is_correct: true, order_index: 0 },
      { id: 2, text: "ב", is_correct: false, order_index: 1 },
    ],
    ...partial,
  };
}

describe("answerKeyDraft", () => {
  it("bascule une seule bonne réponse en QCM simple", () => {
    const question = qcm({ id: 10 });
    const next = toggleAnswerKeyOption(draftFromQuestions([question]), question, 2);
    expect(next[10]).toEqual([2]);
    expect(answerKeyChanged([question], next)).toBe(true);
    expect(isAnswerKeyDraftValid([question], next)).toBe(true);
  });

  it("autorise plusieurs bonnes réponses en multiple", () => {
    const question = qcm({
      id: 11,
      question_type: "multiple",
      options: [
        { id: 1, text: "א", is_correct: true, order_index: 0 },
        { id: 2, text: "ב", is_correct: false, order_index: 1 },
      ],
    });
    const next = toggleAnswerKeyOption(draftFromQuestions([question]), question, 2);
    expect(next[11].sort()).toEqual([1, 2]);
    expect(isAnswerKeyDraftValid([question], { 11: [] })).toBe(false);
  });
});
