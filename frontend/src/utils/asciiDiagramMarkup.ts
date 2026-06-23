import type { MarkedTextSegment } from "./codeBlockMarkup";

const DIAGRAM_CHARS_RE = /^[\s\d/\\|+\-_.^v<>]*$/;

function isDiagramSignalLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || !DIAGRAM_CHARS_RE.test(line)) return false;
  if (/[/\\]/.test(line)) return true;
  return /^\d+$/.test(trimmed);
}

type LineKind = "text" | "diagram" | "blank";

function classifyLines(lines: string[]): LineKind[] {
  const kinds = lines.map((line): LineKind => {
    if (line.trim() === "") return "blank";
    return isDiagramSignalLine(line) ? "diagram" : "text";
  });
  for (let i = 0; i < kinds.length; i += 1) {
    if (kinds[i] !== "blank") continue;
    const prev = kinds.slice(0, i).reverse().find((k) => k !== "blank");
    const next = kinds.slice(i + 1).find((k) => k !== "blank");
    if (prev === "diagram" && next === "diagram") kinds[i] = "diagram";
  }
  return kinds;
}

function isValidDiagramBlock(lines: string[]): boolean {
  if (lines.length === 0) return false;
  const hasBranch = lines.some((line) => /[/\\]/.test(line));
  const hasNumber = lines.some((line) => /^\s*\d+\s*$/.test(line));
  return hasBranch && hasNumber;
}

export function splitTextForAsciiDiagrams(text: string): MarkedTextSegment[] {
  if (!text) return [];
  const lines = text.split("\n");
  const kinds = classifyLines(lines);
  const segments: MarkedTextSegment[] = [];
  let textBuf: string[] = [];
  let diagramBuf: string[] = [];

  const flushText = () => {
    if (textBuf.length === 0) return;
    segments.push({ kind: "text", content: textBuf.join("\n") });
    textBuf = [];
  };

  const flushDiagram = () => {
    if (diagramBuf.length === 0) return;
    if (isValidDiagramBlock(diagramBuf)) {
      flushText();
      segments.push({ kind: "code", content: diagramBuf.join("\n") });
    } else {
      textBuf.push(...diagramBuf);
    }
    diagramBuf = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (kinds[i] === "diagram" || kinds[i] === "blank") {
      flushText();
      diagramBuf.push(line);
      continue;
    }
    flushDiagram();
    textBuf.push(line);
  }
  flushDiagram();
  flushText();
  return segments.length > 0 ? segments : [{ kind: "text", content: text }];
}
