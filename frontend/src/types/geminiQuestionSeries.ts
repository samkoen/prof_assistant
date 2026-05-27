import type { QuestionType } from "../utils/qcmImportParser";

export type GeminiSeriesLevel = "easy" | "medium" | "hard";

export type GeminiSeriesLanguage = "he" | "fr" | "en" | "ru";

export interface GeminiQuestionSeriesDraft {
  id: string;
  subject: string;
  questionCount: number;
  level: GeminiSeriesLevel;
  questionTypes: QuestionType[];
  language: GeminiSeriesLanguage;
}

export function createGeminiQuestionSeries(): GeminiQuestionSeriesDraft {
  return {
    id: crypto.randomUUID(),
    subject: "",
    questionCount: 5,
    level: "medium",
    questionTypes: ["single"],
    language: "he",
  };
}

export const GEMINI_SERIES_LEVELS: GeminiSeriesLevel[] = ["easy", "medium", "hard"];

export const GEMINI_SERIES_LANGUAGES: GeminiSeriesLanguage[] = ["he", "fr", "en", "ru"];

export const GEMINI_QUESTION_TYPES: QuestionType[] = ["single", "multiple", "true_false"];
