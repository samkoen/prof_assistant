import type { GeminiQuestionSeriesDraft } from "../types/geminiQuestionSeries";
import { stripEditorBidiMarks } from "./examQuestionsLanguage";

export interface GeminiSeriesApiPayload {
  instructions: string;
  question_count: number;
  level: "easy" | "medium" | "hard";
  question_types: ("single" | "multiple" | "true_false" | "open")[];
  language: "he" | "fr" | "en" | "ru";
}

export function seriesListToApiPayload(
  series: GeminiQuestionSeriesDraft[],
): GeminiSeriesApiPayload[] {
  return series.map((s) => ({
    instructions: stripEditorBidiMarks(s.instructions).trim(),
    question_count: s.questionCount,
    level: s.level,
    question_types: s.questionTypes,
    language: s.language,
  }));
}
