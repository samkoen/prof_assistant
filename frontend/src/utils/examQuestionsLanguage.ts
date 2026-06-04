export type ExamQuestionsLanguage = "he" | "fr" | "en" | "ru";

const HEBREW_RE = /[\u0590-\u05FF]/;
const LATIN_RE = /[A-Za-zÀ-ÿĀ-žА-я]/;

export type QuestionContentSample = {
  text: string;
  order_index: number;
  id?: number;
  options?: { text: string; order_index?: number }[];
};

/** Marqueurs invisibles de l’éditeur mixte — à retirer à l’affichage. */
export function stripEditorBidiMarks(text: string): string {
  return text.replace(/[\u200E\u200F]/g, "");
}

/** Direction d’affichage pour une question/réponse (pas seulement la 1ʳᵉ question de l’examen). */
export function contentDirForQuestionText(text: string): "ltr" | "rtl" {
  return textLooksHebrew(stripEditorBidiMarks(text)) ? "rtl" : "ltr";
}

const MATH_NEUTRAL = "+-*/=^_{}().,[]";

export function firstNonEmptyLine(lines: string[]): string {
  return lines.find((l) => l.trim().length > 0) ?? lines[0] ?? "";
}

/** Direction d’une ligne selon son premier caractère fort (pas la majorité). */
export function contentDirForLine(line: string): "ltr" | "rtl" {
  const body = stripEditorBidiMarks(line);
  for (const ch of body) {
    if (HEBREW_RE.test(ch)) return "rtl";
    if (LATIN_RE.test(ch) || /[0-9]/.test(ch) || MATH_NEUTRAL.includes(ch)) return "ltr";
  }
  return "rtl";
}

export function textLooksHebrew(text: string): boolean {
  const hebrew = (text.match(HEBREW_RE) || []).length;
  const latin = (text.match(LATIN_RE) || []).length;
  if (hebrew === 0) return false;
  if (latin === 0) return true;
  return hebrew >= latin;
}

function sampleTextFromQuestion(q: QuestionContentSample): string {
  const opts = [...(q.options ?? [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
  );
  return [q.text, ...opts.map((o) => o.text)].filter((t) => t.trim()).join("\n");
}

export function contentDirFromFirstQuestion(questions: QuestionContentSample[]): "ltr" | "rtl" {
  if (!questions.length) return "rtl";
  const sorted = [...questions].sort(
    (a, b) => a.order_index - b.order_index || (a.id ?? 0) - (b.id ?? 0),
  );
  return textLooksHebrew(sampleTextFromQuestion(sorted[0])) ? "rtl" : "ltr";
}

export function contentDirForExam(
  questions: QuestionContentSample[],
  fallbackLang?: ExamQuestionsLanguage | string,
): "ltr" | "rtl" {
  if (questions.length > 0) return contentDirFromFirstQuestion(questions);
  return fallbackLang === "he" ? "rtl" : "ltr";
}

/** @deprecated Préférer contentDirForExam — conserve le fallback si pas de questions. */
export function contentDirForQuestionsLanguage(
  lang: ExamQuestionsLanguage | string | undefined,
): "ltr" | "rtl" {
  return lang === "he" ? "rtl" : "ltr";
}

export function formatExamPointsLabel(points: number, contentDir: "ltr" | "rtl"): string {
  if (contentDir === "ltr") return points === 1 ? "1 pt" : `${points} pts`;
  return `${points} נק'`;
}
