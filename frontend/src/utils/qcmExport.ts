import type { Question } from "../api/client";

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function formatPoints(points: number): string {
  const rounded = Math.round(points * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatQuestionHeader(index: number, type: string, points: number): string {
  const pts = formatPoints(points);
  if (type === "true_false") {
    return points === 1 ? `Q${index} [true_false]` : `Q${index} [true_false] (${pts} pt)`;
  }
  if (type === "open") {
    return points === 1 ? `Q${index} [open]` : `Q${index} [open] (${pts} pt)`;
  }
  return `Q${index} [${type}] (${pts} pt)`;
}

function formatSingleLineOption(letter: string, text: string, isCorrect: boolean): string {
  const body = text.trim();
  return isCorrect ? `${letter}) ${body} *` : `${letter}) ${body}`;
}

function formatMultilineOption(letter: string, lines: string[], isCorrect: boolean): string {
  const out = [`${letter})`];
  lines.forEach((line, i) => {
    const suffix = i === lines.length - 1 && isCorrect ? " *" : "";
    out.push(`   ${line}${suffix}`);
  });
  return out.join("\n");
}

function formatLetterOption(letter: string, text: string, isCorrect: boolean): string {
  const lines = text.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
  if (lines.length === 0) {
    return isCorrect ? `${letter}) *` : `${letter})`;
  }
  if (lines.length === 1 && lines[0].length <= 80) {
    return formatSingleLineOption(letter, lines[0], isCorrect);
  }
  return formatMultilineOption(letter, lines, isCorrect);
}

function formatTrueFalseOptions(
  options: { text: string; is_correct: boolean | null; order_index: number }[],
): string {
  const sorted = [...options].sort((a, b) => a.order_index - b.order_index);
  return sorted
    .map((opt) => {
      const star = opt.is_correct ? " *" : "";
      return `${opt.text.trim()}${star}`;
    })
    .join("\n");
}

function formatChoiceOptions(
  options: { text: string; is_correct: boolean | null; order_index: number }[],
): string {
  const sorted = [...options].sort((a, b) => a.order_index - b.order_index);
  return sorted
    .map((opt, i) => {
      const letter = OPTION_LETTERS[i] ?? String(i + 1);
      return formatLetterOption(letter, opt.text, !!opt.is_correct);
    })
    .join("\n");
}

export function questionToQcmBlock(question: Question, index: number): string {
  const header = formatQuestionHeader(index, question.question_type, question.points);
  const body = question.text.trim();
  if (question.question_type === "open") {
    const model = (question.model_answer ?? "").trim();
    return model ? [header, body, `ANSWER:\n${model}`].join("\n") : [header, body].join("\n");
  }
  const options =
    question.question_type === "true_false"
      ? formatTrueFalseOptions(question.options)
      : formatChoiceOptions(question.options);
  return [header, body, options].filter(Boolean).join("\n");
}

export function questionsToQcmText(questions: Question[]): string {
  const sorted = [...questions].sort((a, b) => a.order_index - b.order_index || a.id - b.id);
  return sorted.map((q, i) => questionToQcmBlock(q, i + 1)).join("\n---\n");
}

export interface PortableImageWarning {
  questionIndex: number;
  questionText: string;
  optionLabels: string[];
}

export function listPortableImageWarnings(questions: Question[]): PortableImageWarning[] {
  const sorted = [...questions].sort((a, b) => a.order_index - b.order_index || a.id - b.id);
  const warnings: PortableImageWarning[] = [];
  sorted.forEach((q, i) => {
    const optionLabels: string[] = [];
    if (q.image_url) optionLabels.push("שאלה");
    q.options.forEach((opt, oi) => {
      if (opt.image_url) {
        const letter = OPTION_LETTERS[oi] ?? String(oi + 1);
        optionLabels.push(`אפשרות ${letter}`);
      }
    });
    if (optionLabels.length > 0) {
      warnings.push({
        questionIndex: i + 1,
        questionText: q.text.trim().slice(0, 80),
        optionLabels,
      });
    }
  });
  return warnings;
}
