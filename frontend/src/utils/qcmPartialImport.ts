import { parseQcmText, splitQuestionBlocks, type ParseResult } from "./qcmImportParser";

export function partialImportCounts(result: ParseResult): { valid: number; skipped: number } {
  return { valid: result.questions.length, skipped: result.errors.length };
}

export function canImportValidQuestions(result: ParseResult): boolean {
  return result.questions.length > 0;
}

export function shouldClearPasteAfterImport(result: ParseResult): boolean {
  return result.errors.length === 0;
}

export function remainingPasteAfterImport(raw: string): string {
  const result = parseQcmText(raw);
  if (result.errors.length === 0) return "";
  if (result.errors.some((e) => e.block === 0)) return raw.trim();
  const blocks = splitQuestionBlocks(raw);
  const keep = new Set(result.errors.map((e) => e.block));
  return blocks.filter((_, i) => keep.has(i + 1)).join("\n---\n");
}
