import { stripEditorBidiMarks } from "./examQuestionsLanguage";
import { mixedLineBlockSx } from "../styles/bidiMixedText";

export function isBlankDisplayLine(line: string): boolean {
  return stripEditorBidiMarks(line).trim().length === 0;
}

export const emptyMixedLineSx = {
  minHeight: "1.5em",
} as const;

export const codeBlockDisplaySx = {
  display: "block",
  width: "100%",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "0.9em",
  bgcolor: "action.hover",
  borderRadius: 0.75,
  px: 1,
  py: 0.75,
  my: 0.5,
  direction: "ltr" as const,
  textAlign: "left" as const,
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-word" as const,
  unicodeBidi: "plaintext" as const,
} as const;

export function mixedLineDisplaySx(line: string, questionText?: string) {
  const base = mixedLineBlockSx(line, questionText);
  if (isBlankDisplayLine(line)) return { ...base, ...emptyMixedLineSx };
  return base;
}
