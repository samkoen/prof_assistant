import type { QuestionType } from "../utils/qcmImportParser";

export type GeminiSeriesLevel = "easy" | "medium" | "hard";

export type GeminiSeriesLanguage = "he" | "fr" | "en" | "ru";

export type InstructionsTextDirection = "ltr" | "rtl";

export interface GeminiQuestionSeriesDraft {
  id: string;
  instructions: string;
  instructionsDir: InstructionsTextDirection;
  questionCount: number;
  level: GeminiSeriesLevel;
  questionTypes: QuestionType[];
  language: GeminiSeriesLanguage;
}

export function defaultInstructionsDir(
  language: GeminiSeriesLanguage,
): InstructionsTextDirection {
  return language === "he" ? "rtl" : "ltr";
}

export function createGeminiQuestionSeries(): GeminiQuestionSeriesDraft {
  const language: GeminiSeriesLanguage = "he";
  return {
    id: crypto.randomUUID(),
    instructions: "",
    instructionsDir: defaultInstructionsDir(language),
    questionCount: 5,
    level: "medium",
    questionTypes: ["single"],
    language,
  };
}

export const GEMINI_SERIES_LEVELS: GeminiSeriesLevel[] = ["easy", "medium", "hard"];

export const GEMINI_SERIES_LANGUAGES: GeminiSeriesLanguage[] = ["he", "fr", "en", "ru"];

export const GEMINI_QUESTION_TYPES: QuestionType[] = ["single", "multiple", "open"];

export interface GeminiGenerationProgress {
  total_questions: number;
  generated_questions: number;
  completed_batches: number;
  total_batches: number;
  complete: boolean;
}

export interface GeminiGenerationSession {
  id: number;
  exam_id: number;
  status: string;
  raw_text: string | null;
  messages: GeminiGenerationMessage[];
  generation_progress?: GeminiGenerationProgress | null;
  generation_warnings?: string[];
  answer_checks?: GeminiAnswerCheck[];
}

/** Double vérification d'une question à choix (résolution indépendante par l'AI). */
export interface GeminiAnswerCheck {
  q_num: number;
  status: "verified" | "mismatch" | "unchecked";
  /** Lettres marquées par la génération (A, B…). */
  generated: string[];
  /** Lettres trouvées par la vérification ; vide = aucune option jugée correcte. */
  checked: string[];
  reason: string;
  /** Raisonnement écrit par le générateur avant de marquer la réponse. */
  solution: string;
  /** Vérifiée en exécutant du code (questions de code / calcul). */
  computed: boolean;
}

export interface GeminiGenerationMessage {
  id: number;
  role: "user" | "model";
  content: string;
  created_at: string;
}
