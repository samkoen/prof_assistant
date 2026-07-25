import { he } from "../i18n/he";
import type { ParseError } from "./qcmImportParser";

/** Messages bruts du parseur → libellés adaptés au flux Gemini (he.ts). */
const GEMINI_PARSE_MESSAGE: Record<string, string> = {
  "בלוק ריק": he.geminiParseErrEmptyBlock,
  "לא נמצאו אפשרויות תשובה": he.geminiParseErrNoOptions,
  "חסר טקסט לשאלה": he.geminiParseErrMissingText,
  "חסרות אפשרויות": he.geminiParseErrNoOptionsShort,
  "שאלת נכון/לא נכון דורשת 2 אפשרויות": he.geminiParseErrTfTwo,
  "נדרשת תשובה נכונה אחת (סמן ב-*)": he.geminiParseErrSingleStar,
  "בחירה יחידה: יותר מתשובה נכונה אחת (סמן * רק על אפשרות אחת)": he.geminiParseErrSingleTooMany,
  "לפחות תשובה נכונה אחת (סמן ב-*)": he.geminiParseErrMultipleStar,
  "לפחות תשובה נכונה אחת": he.geminiParseErrMultipleNoCorrect,
  "נדרשת תשובה נכונה אחת": he.geminiParseErrSingleNoCorrect,
  "אין תוכן להדבקה": he.geminiParseErrNoContent,
  "JSON לא תקין": he.geminiParseErrInvalidJson,
};

export function geminiParseErrorDetail(error: ParseError): string {
  return GEMINI_PARSE_MESSAGE[error.message] ?? error.message;
}

export function geminiParseErrorLocation(block: number): string {
  if (block <= 0) return he.geminiParseErrGeneral;
  return `${he.geminiParseQuestionLabel} ${block}`;
}

export const GEMINI_FIX_STARS_REFINE_MESSAGE =
  "סמנו שורת * אחרי האפשרות הנכונה בכל שאלת בחירה יחידה — בדיוק לפי הפורמט";
