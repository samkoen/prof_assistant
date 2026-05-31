import type { ReactNode } from "react";

/** Schéma ASCII (arbres AVL, etc.) — ne pas interpréter \\ comme échappement. */
export function looksLikeAsciiDiagram(text: string): boolean {
  if (!text.includes("\n")) return false;
  return /[/\\]/.test(text) && /\d/.test(text);
}

export const asciiDiagramSx = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  direction: "ltr",
  textAlign: "left",
  unicodeBidi: "plaintext",
} as const;

/** Lit un exposant / indice : ^{…}, ^2, ^10, ^n */
function readScript(input: string, start: number): [string, number] | null {
  if (start >= input.length) return null;
  if (input[start] === "{") {
    const end = input.indexOf("}", start + 1);
    if (end === -1) return null;
    return [input.slice(start + 1, end), end + 1];
  }
  const match = input.slice(start).match(/^([0-9]+|[a-zA-Z])/);
  if (!match) return null;
  return [match[1], start + match[1].length];
}

/** Transforme n^2, x_{i}, a^10 en nœuds React avec <sup> / <sub>. */
export function renderMathMarkup(text: string): ReactNode[] {
  if (looksLikeAsciiDiagram(text)) return [text];

  const nodes: ReactNode[] = [];
  let buffer = "";
  let i = 0;
  let key = 0;

  const flush = () => {
    if (!buffer) return;
    nodes.push(buffer);
    buffer = "";
  };

  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") {
      if (text[i + 1] === "\\") {
        buffer += "\\";
        i += 2;
        continue;
      }
      buffer += "\\";
      i += 1;
      continue;
    }
    if (ch === "^" || ch === "_") {
      const parsed = readScript(text, i + 1);
      if (parsed) {
        flush();
        const [value, next] = parsed;
        const Tag = ch === "^" ? "sup" : "sub";
        nodes.push(
          <Tag key={`m-${key++}`} dir="ltr">
            {value}
          </Tag>,
        );
        i = next;
        continue;
      }
    }
    buffer += ch;
    i += 1;
  }
  flush();
  return nodes;
}

export const mathTextSx = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  "& sup": {
    fontSize: "0.75em",
    lineHeight: 1,
    verticalAlign: "super",
    unicodeBidi: "isolate",
  },
  "& sub": {
    fontSize: "0.75em",
    lineHeight: 1,
    verticalAlign: "sub",
    unicodeBidi: "isolate",
  },
} as const;
