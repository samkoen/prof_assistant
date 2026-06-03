export type ExamQuestionsLanguage = "he" | "fr" | "en" | "ru";

const HEBREW_RE = /[\u0590-\u05FF]/;
const LATIN_RE = /[A-Za-zÀ-ÿĀ-žА-я]/;

export type QuestionContentSample = {
  text: string;
  order_index: number;
  id?: number;
  options?: { text: string; order_index?: number }[];
};

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
