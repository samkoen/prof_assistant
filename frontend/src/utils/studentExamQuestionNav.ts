import type { StudentQuestion } from "../api/client";

export function examQuestionElementId(index: number): string {
  return `exam-question-${index}`;
}

export function isQuestionAnswered(
  answers: Record<number, number[]>,
  questionId: number,
): boolean {
  return (answers[questionId]?.length ?? 0) > 0;
}

export function countAnsweredQuestions(
  questions: StudentQuestion[],
  answers: Record<number, number[]>,
): number {
  return questions.filter((q) => isQuestionAnswered(answers, q.id)).length;
}

export function findNextUnansweredIndex(
  questions: StudentQuestion[],
  answers: Record<number, number[]>,
  afterIndex: number,
): number | null {
  const unansweredAt = (i: number) => !isQuestionAnswered(answers, questions[i].id);
  for (let i = afterIndex + 1; i < questions.length; i += 1) {
    if (unansweredAt(i)) return i;
  }
  for (let i = 0; i <= afterIndex; i += 1) {
    if (unansweredAt(i)) return i;
  }
  return null;
}

export function scrollToExamQuestion(index: number): void {
  document.getElementById(examQuestionElementId(index + 1))?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}
