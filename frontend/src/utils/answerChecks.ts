import type { GeminiAnswerCheck } from "../types/geminiQuestionSeries";
import type { ParsedQuestion } from "./qcmImportParser";

/** Choix du prof pour une réponse contestée : garder la génération ou prendre la vérification. */
export type CheckResolution = "generated" | "checked";
export type CheckResolutions = Record<number, CheckResolution>;

const LETTERS = "ABCDEFGH";

export function checkFor(question: ParsedQuestion, checks: GeminiAnswerCheck[]): GeminiAnswerCheck | undefined {
  if (question.q_num == null || question.question_type === "open") return undefined;
  return checks.find((c) => c.q_num === question.q_num);
}

/** Une contestation n'est applicable que si la vérification désigne au moins une option existante. */
export function canUseChecked(question: ParsedQuestion, check: GeminiAnswerCheck): boolean {
  return check.checked.length > 0 && check.checked.every((l) => LETTERS.indexOf(l) < question.options.length);
}

/** Questions contestées sans décision du prof : elles bloquent l'ajout à la מטלה. */
export function pendingMismatches(
  questions: ParsedQuestion[],
  checks: GeminiAnswerCheck[],
  resolutions: CheckResolutions,
): number[] {
  return questions
    .map((q) => checkFor(q, checks))
    .filter((c): c is GeminiAnswerCheck => c?.status === "mismatch" && !resolutions[c.q_num])
    .map((c) => c.q_num);
}

/** Plusieurs bonnes réponses sur un choix unique : le type devient בחירה מרובה. */
export function promotesToMultiple(question: ParsedQuestion, letters: string[]): boolean {
  return question.question_type === "single" && letters.length > 1;
}

function withLetters(question: ParsedQuestion, letters: string[]): ParsedQuestion {
  return {
    ...question,
    question_type: promotesToMultiple(question, letters) ? "multiple" : question.question_type,
    options: question.options.map((o, i) => ({ ...o, is_correct: letters.includes(LETTERS[i]) })),
  };
}

/** Applique les décisions « prendre la vérification » avant l'import. */
export function applyResolutions(
  questions: ParsedQuestion[],
  checks: GeminiAnswerCheck[],
  resolutions: CheckResolutions,
): ParsedQuestion[] {
  return questions.map((q) => {
    const check = checkFor(q, checks);
    if (!check || resolutions[check.q_num] !== "checked" || !canUseChecked(q, check)) return q;
    return withLetters(q, check.checked);
  });
}

export type CheckSummary = { verified: number; mismatch: number; unchecked: number };

export function summarizeChecks(questions: ParsedQuestion[], checks: GeminiAnswerCheck[]): CheckSummary {
  const summary: CheckSummary = { verified: 0, mismatch: 0, unchecked: 0 };
  for (const q of questions) {
    const check = checkFor(q, checks);
    if (check) summary[check.status] += 1;
  }
  return summary;
}
