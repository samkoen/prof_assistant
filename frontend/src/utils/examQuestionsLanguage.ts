export type ExamQuestionsLanguage = "he" | "fr" | "en" | "ru";

export function contentDirForQuestionsLanguage(
  lang: ExamQuestionsLanguage | string | undefined,
): "ltr" | "rtl" {
  return lang === "he" ? "rtl" : "ltr";
}
