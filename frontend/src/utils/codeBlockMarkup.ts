import { splitTextForAsciiDiagrams } from "./asciiDiagramMarkup";

export const CODE_FENCE = "```";

export type MarkedTextSegment =
  | { kind: "text"; content: string }
  | { kind: "code"; content: string };

function trimFenceInner(code: string): string {
  let inner = code;
  if (inner.startsWith("\n")) inner = inner.slice(1);
  if (inner.endsWith("\n")) inner = inner.slice(0, -1);
  return inner;
}

export function parseMarkedTextSegments(text: string): MarkedTextSegment[] {
  if (!text.includes(CODE_FENCE)) {
    return text ? [{ kind: "text", content: text }] : [];
  }

  const segments: MarkedTextSegment[] = [];
  let pos = 0;

  while (pos <= text.length) {
    const open = text.indexOf(CODE_FENCE, pos);
    if (open === -1) {
      const tail = text.slice(pos);
      if (tail) segments.push({ kind: "text", content: tail });
      break;
    }
    if (open > pos) {
      segments.push({ kind: "text", content: text.slice(pos, open) });
    }
    const close = text.indexOf(CODE_FENCE, open + CODE_FENCE.length);
    if (close === -1) {
      segments.push({ kind: "text", content: text.slice(open) });
      break;
    }
    segments.push({
      kind: "code",
      content: trimFenceInner(text.slice(open + CODE_FENCE.length, close)),
    });
    pos = close + CODE_FENCE.length;
  }

  return segments;
}

/** Blocs ``` explicites, puis détection auto des diagrammes ASCII (arbres, / \\). */
export function parseDisplayTextSegments(text: string): MarkedTextSegment[] {
  const fenced = parseMarkedTextSegments(text);
  const out: MarkedTextSegment[] = [];
  for (const seg of fenced) {
    if (seg.kind === "code") {
      out.push(seg);
      continue;
    }
    out.push(...splitTextForAsciiDiagrams(seg.content));
  }
  return out;
}

function isSelectionFenced(value: string, start: number, end: number): boolean {
  return (
    start >= CODE_FENCE.length &&
    value.slice(start - CODE_FENCE.length, start) === CODE_FENCE &&
    value.slice(end, end + CODE_FENCE.length) === CODE_FENCE
  );
}

function unwrapFencedSelection(value: string, start: number, end: number) {
  let innerStart = start;
  let innerEnd = end;
  if (value[innerStart] === "\n") innerStart += 1;
  if (innerEnd > innerStart && value[innerEnd - 1] === "\n") innerEnd -= 1;
  const removeFrom = start - CODE_FENCE.length;
  const removeTo = end + CODE_FENCE.length;
  const text = value.slice(0, removeFrom) + value.slice(innerStart, innerEnd) + value.slice(removeTo);
  const selectionStart = removeFrom;
  const selectionEnd = selectionStart + (innerEnd - innerStart);
  return { text, selectionStart, selectionEnd };
}

function wrapAsFenced(value: string, start: number, end: number) {
  const selected = value.slice(start, end);
  const wrapped = `${CODE_FENCE}\n${selected}\n${CODE_FENCE}`;
  const text = value.slice(0, start) + wrapped + value.slice(end);
  const selectionStart = start + CODE_FENCE.length + 1;
  const selectionEnd = selectionStart + selected.length;
  return { text, selectionStart, selectionEnd };
}

export function toggleCodeMarkup(
  value: string,
  start: number,
  end: number,
): { text: string; selectionStart: number; selectionEnd: number } {
  if (start >= end) {
    return { text: value, selectionStart: start, selectionEnd: end };
  }
  if (isSelectionFenced(value, start, end)) {
    return unwrapFencedSelection(value, start, end);
  }
  return wrapAsFenced(value, start, end);
}
