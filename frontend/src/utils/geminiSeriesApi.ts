import type { GeminiQuestionSeriesDraft } from "../types/geminiQuestionSeries";

export interface GeminiSeriesApiPayload {
  instructions: string;
  question_count: number;
  level: "easy" | "medium" | "hard";
  question_types: ("single" | "multiple" | "true_false")[];
  language: "he" | "fr" | "en" | "ru";
}

export function seriesListToApiPayload(
  series: GeminiQuestionSeriesDraft[],
): GeminiSeriesApiPayload[] {
  return series.map((s) => ({
    instructions: s.instructions.trim(),
    question_count: s.questionCount,
    level: s.level,
    question_types: s.questionTypes,
    language: s.language,
  }));
}
