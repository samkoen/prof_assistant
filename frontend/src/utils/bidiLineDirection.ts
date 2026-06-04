import type { KeyboardEvent } from "react";
import type { TextDirection } from "./textDirectionShortcut";

const HEBREW_RE = /[\u0590-\u05FF\uFB1D-\uFB4F]/;
const LTR_STRONG_RE = /[A-Za-z0-9]/;
const BIDI_MARKS_RE = /^[\u200E\u200F\u202A-\u202E]+/;

export const BIDI_LRM = "\u200E";
export const BIDI_RLM = "\u200F";

export function bidiMarkForDirection(dir: TextDirection): string {
  return dir === "ltr" ? BIDI_LRM : BIDI_RLM;
}

export function lineDirectionFromMarks(line: string): TextDirection | null {
  if (line.startsWith(BIDI_LRM)) return "ltr";
  if (line.startsWith(BIDI_RLM)) return "rtl";
  return null;
}

export function lineDirectionFromContent(line: string): TextDirection | null {
  const body = line.replace(BIDI_MARKS_RE, "");
  for (const ch of body) {
    if (HEBREW_RE.test(ch)) return "rtl";
    if (LTR_STRONG_RE.test(ch) || "+-*/=^_{}().,[]".includes(ch)) return "ltr";
  }
  return null;
}

export function resolveLineDirection(line: string, fallback: TextDirection): TextDirection {
  return lineDirectionFromMarks(line) ?? lineDirectionFromContent(line) ?? fallback;
}

export function cursorLineIndex(text: string, cursor: number): number {
  return text.slice(0, cursor).split("\n").length - 1;
}

export function lineAt(text: string, lineIndex: number): string {
  return text.split("\n")[lineIndex] ?? "";
}

export function directionForNewLine(text: string, cursorBeforeNewline: number): TextDirection {
  const lineIdx = cursorLineIndex(text, cursorBeforeNewline);
  const current = lineAt(text, lineIdx);
  const prev = lineIdx > 0 ? lineAt(text, lineIdx - 1) : "";
  const fallback = prev ? resolveLineDirection(prev, "rtl") : "rtl";
  if (!current.replace(BIDI_MARKS_RE, "").trim() && prev) return resolveLineDirection(prev, fallback);
  return resolveLineDirection(current, fallback);
}

function reconcileOneLine(line: string): string {
  const body = line.replace(BIDI_MARKS_RE, "");
  const fromContent = lineDirectionFromContent(body);
  if (fromContent) return bidiMarkForDirection(fromContent) + body;
  const inherited = lineDirectionFromMarks(line);
  if (inherited) return bidiMarkForDirection(inherited) + body;
  return body;
}

/** Marque de tête par ligne : contenu fort prime ; ligne vide garde le défaut (hérité à Entrée). */
export function reconcileMixedLineMarks(text: string): string {
  if (!text) return text;
  return text.split("\n").map(reconcileOneLine).join("\n");
}

export function cursorInLine(text: string, cursor: number): number {
  const lineStart = text.lastIndexOf("\n", Math.max(0, cursor - 1)) + 1;
  return cursor - lineStart;
}

export function cursorAfterLineReconcile(
  oldLine: string,
  newLine: string,
  cursorInLine: number,
): number {
  const oldBody = oldLine.replace(BIDI_MARKS_RE, "");
  const newBody = newLine.replace(BIDI_MARKS_RE, "");
  if (oldBody !== newBody) return cursorInLine;
  const oldPrefix = oldLine.length - oldBody.length;
  const newPrefix = newLine.length - newBody.length;
  return cursorInLine + (newPrefix - oldPrefix);
}

export function applyMixedTextChange(
  prev: string,
  raw: string,
  cursor: number,
): { text: string; cursor: number } {
  const reconciled = reconcileMixedLineMarks(raw);
  if (reconciled === raw) return { text: reconciled, cursor };
  const lineIdx = cursorLineIndex(raw, cursor);
  const oldLine = lineAt(raw, lineIdx);
  const newLine = lineAt(reconciled, lineIdx);
  const posInLine = cursorInLine(raw, cursor);
  const newPosInLine = cursorAfterLineReconcile(oldLine, newLine, posInLine);
  const lineStart = reconciled.split("\n").slice(0, lineIdx).join("\n").length + (lineIdx > 0 ? 1 : 0);
  return { text: reconciled, cursor: lineStart + newPosInLine };
}

export function tryInsertMixedNewline(
  e: KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onChange: (next: string) => void,
): number | null {
  if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return null;
  const el = e.currentTarget;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (start !== end) return null;

  const dir = directionForNewLine(value, start);
  const mark = bidiMarkForDirection(dir);
  e.preventDefault();
  onChange(`${value.slice(0, start)}\n${mark}${value.slice(end)}`);
  return start + 1 + mark.length;
}
