import type { QuestionType } from "../utils/qcmImportParser";

export type GeminiSeriesLevel = "easy" | "medium" | "hard";

export type GeminiSeriesLanguage = "he" | "fr" | "en" | "ru";

export interface GeminiQuestionSeriesDraft {
  id: string;
  instructions: string;
  questionCount: number;
  level: GeminiSeriesLevel;
  questionTypes: QuestionType[];
  language: GeminiSeriesLanguage;
}

export function createGeminiQuestionSeries(): GeminiQuestionSeriesDraft {
  return {
    id: crypto.randomUUID(),
    instructions: "",
    questionCount: 5,
    level: "medium",
    questionTypes: ["single"],
    language: "he",
  };
}

export const GEMINI_SERIES_LEVELS: GeminiSeriesLevel[] = ["easy", "medium", "hard"];

export const GEMINI_SERIES_LANGUAGES: GeminiSeriesLanguage[] = ["he", "fr", "en", "ru"];

export const GEMINI_QUESTION_TYPES: QuestionType[] = ["single", "multiple", "true_false"];

export interface GeminiGenerationSession {
  id: number;
  exam_id: number;
  status: string;
  raw_text: string | null;
  messages: GeminiGenerationMessage[];
}

export interface GeminiGenerationMessage {
  id: number;
  role: "user" | "model";
  content: string;
  created_at: string;
}
