import type { Exam, ExamDetail } from "../api/client";
import { he } from "../i18n/he";
import {
  listPortableImageWarnings,
  questionsToQcmText,
  type PortableImageWarning,
} from "./qcmExport";

type ExamLike = Exam | ExamDetail;

function yesNo(value: boolean): string {
  return value ? he.yes : he.no;
}

function scoringLabel(mode: string): string {
  if (mode === "all_or_nothing") return he.portableScoringAllOrNothing;
  return he.portableScoringProportional;
}

function languageLabel(code: string): string {
  if (code === "fr") return he.geminiLangFrench;
  if (code === "en") return he.geminiLangEnglish;
  if (code === "ru") return he.geminiLangRussian;
  return he.geminiLangHebrew;
}

function appendLine(lines: string[], label: string, value: string): void {
  lines.push(`${label}: ${value}`);
}

export function buildExamSettingsText(exam: ExamLike): string {
  const lines: string[] = [];
  appendLine(lines, he.examTitle, exam.title);
  if (exam.description?.trim()) {
    appendLine(lines, he.portableExamDescription, exam.description.trim());
  }
  appendLine(lines, he.examDurationMinutes, String(exam.duration_minutes));
  appendLine(lines, he.examWarningMinutes, String(exam.warning_minutes));
  appendLine(lines, he.portableShuffleQuestions, yesNo(exam.shuffle_questions));
  appendLine(lines, he.portableShuffleOptions, yesNo(exam.shuffle_options));
  appendLine(lines, he.portableShowCorrection, yesNo(exam.show_detailed_correction));
  appendLine(lines, he.autoSubmitOnTimeout, yesNo(exam.auto_submit_on_timeout));
  appendLine(lines, he.portableDefaultScoring, scoringLabel(exam.default_multiple_scoring));
  appendLine(lines, he.geminiSeriesLanguage, languageLabel(exam.questions_language));
  return lines.join("\n");
}

export interface ExamPortableExport {
  settingsText: string;
  questionsText: string;
  imageWarnings: PortableImageWarning[];
  questionCount: number;
}

export function buildExamPortableExport(exam: ExamDetail): ExamPortableExport {
  return {
    settingsText: buildExamSettingsText(exam),
    questionsText: questionsToQcmText(exam.questions),
    imageWarnings: listPortableImageWarnings(exam.questions),
    questionCount: exam.questions.length,
  };
}
