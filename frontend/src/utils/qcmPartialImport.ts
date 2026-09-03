import type { ParseResult } from "./qcmImportParser";

export function partialImportCounts(result: ParseResult): { valid: number; skipped: number } {
  return { valid: result.questions.length, skipped: result.errors.length };
}

export function canImportValidQuestions(result: ParseResult): boolean {
  return result.questions.length > 0;
}

export function shouldClearPasteAfterImport(result: ParseResult): boolean {
  return result.errors.length === 0;
}
