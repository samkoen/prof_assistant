export type QuestionType = "single" | "multiple" | "true_false";

export interface ParsedQuestionOption {
  text: string;
  is_correct: boolean;
}

export interface ParsedQuestion {
  text: string;
  question_type: QuestionType;
  points: number;
  options: ParsedQuestionOption[];
}

export interface ParseError {
  block: number;
  message: string;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  errors: ParseError[];
}

export interface QuestionImportPayload {
  text: string;
  question_type: QuestionType;
  order_index: number;
  points: number;
  options: { text: string; is_correct: boolean; order_index: number }[];
}

const HEADER_RE =
  /^(?:Q?\d+[\.\):]?\s*)?(?:\[(single|multiple|true_false|tf|vrai_faux)\])?(?:\s*\((\d+(?:\.\d+)?)\s*(?:pt|pts|נק)?\))?\s*$/i;

const OPTION_START_RE = /^([A-Z])\)\s*(.*)$/;
const TF_RE = /^(?:Vrai|Faux|True|False|נכון|לא נכון|לא)\s*(\*)?\s*$/i;

const TF_LABELS: Record<string, string> = {
  vrai: "נכון",
  true: "נכון",
  "נכון": "נכון",
  faux: "לא נכון",
  false: "לא נכון",
  "לא נכון": "לא נכון",
  "לא": "לא נכון",
};

function normalizeType(raw: string | undefined): QuestionType {
  if (!raw) return "single";
  const t = raw.toLowerCase();
  if (t === "multiple") return "multiple";
  if (t === "true_false" || t === "tf" || t === "vrai_faux") return "true_false";
  return "single";
}

function splitBlocks(raw: string): string[] {
  return raw
    .split(/\n---+\n|^---+\n|\n---+\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean);
}

function stripCorrectMarker(line: string): { text: string; marked: boolean } {
  if (!/\*/.test(line)) return { text: line, marked: false };
  return { text: line.replace(/\s*\*\s*$/, "").replace(/\*/g, "").trimEnd(), marked: true };
}

function trimEdgeBlankLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) start += 1;
  while (end > start && !lines[end - 1].trim()) end -= 1;
  return lines.slice(start, end);
}

/** A) seul ou A) texte — lignes suivantes = même réponse (schémas, plusieurs lignes) ; * = נכון. */
function parseLetterOptions(lines: string[]): ParsedQuestionOption[] {
  const options: ParsedQuestionOption[] = [];
  let chunk: string[] = [];

  const flush = () => {
    const block = trimEdgeBlankLines(chunk);
    if (block.length === 0) return;
    let is_correct = false;
    const parts = block.map((line) => {
      const { text, marked } = stripCorrectMarker(line.trimEnd());
      if (marked) is_correct = true;
      return text;
    });
    const text = parts.join("\n").trim();
    if (text) options.push({ text, is_correct });
    chunk = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const start = trimmed ? OPTION_START_RE.exec(trimmed) : null;
    if (start) {
      flush();
      const rest = start[2].trim();
      if (rest) chunk.push(rest);
      continue;
    }
    if (trimmed && TF_RE.test(trimmed)) return [];
    chunk.push(line.trimEnd());
  }
  flush();
  return options;
}

function findOptionStartIndex(lines: string[], from: number): number {
  for (let i = from; i < lines.length; i++) {
    const t = lines[i].trim();
    if (OPTION_START_RE.test(t) || TF_RE.test(t)) return i;
  }
  return -1;
}

function parseBlock(block: string, blockIndex: number): { q?: ParsedQuestion; error?: ParseError } {
  const rawLines = block.split("\n").map((l) => l.trimEnd());
  const lines = rawLines.map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { error: { block: blockIndex, message: "בלוק ריק" } };
  }

  let type: QuestionType = "single";
  let points = 1;
  const headerMatch = lines[0].match(HEADER_RE);
  let rawStart = 0;
  if (headerMatch && (headerMatch[1] || headerMatch[2] || /^Q?\d/i.test(lines[0]))) {
    type = normalizeType(headerMatch[1]);
    if (headerMatch[2]) points = parseFloat(headerMatch[2]);
    const headerIdx = rawLines.findIndex((l) => l.trim() === lines[0]);
    rawStart = headerIdx >= 0 ? headerIdx + 1 : 1;
  }

  const optionStart = findOptionStartIndex(rawLines, rawStart);
  if (optionStart < 0) {
    return { error: { block: blockIndex, message: "לא נמצאו אפשרויות תשובה" } };
  }

  const text = trimEdgeBlankLines(rawLines.slice(rawStart, optionStart)).join("\n").trim();
  if (!text) {
    return { error: { block: blockIndex, message: "חסר טקסט לשאלה" } };
  }

  const optionSection = rawLines.slice(optionStart);
  let options = parseLetterOptions(optionSection);

  if (options.length === 0) {
    for (const line of optionSection.map((l) => l.trim()).filter(Boolean)) {
      const tf = TF_RE.exec(line);
      if (tf) {
        const key = line.replace(/\*/g, "").trim().toLowerCase();
        const label = TF_LABELS[key] ?? line.replace(/\*/g, "").trim();
        options.push({ text: label, is_correct: !!tf[1] });
        type = "true_false";
      }
    }
  }

  if (options.length === 0) {
    return { error: { block: blockIndex, message: "לא נמצאו אפשרויות תשובה" } };
  }

  const correct = options.filter((o) => o.is_correct);
  if (type === "true_false" && options.length !== 2) {
    return { error: { block: blockIndex, message: "שאלת נכון/לא נכון דורשת 2 אפשרויות" } };
  }
  if (type !== "multiple" && correct.length !== 1) {
    return { error: { block: blockIndex, message: "נדרשת תשובה נכונה אחת (סמן ב-*)" } };
  }
  if (type === "multiple" && correct.length === 0) {
    return { error: { block: blockIndex, message: "לפחות תשובה נכונה אחת (סמן ב-*)" } };
  }

  return {
    q: { text, question_type: type, points, options },
  };
}

export function parseQcmText(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { questions: [], errors: [{ block: 0, message: "אין תוכן להדבקה" }] };
  }

  if (trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed) as { questions?: ParsedQuestion[] };
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return validateParsedQuestions(data.questions);
      }
    } catch {
      return { questions: [], errors: [{ block: 0, message: "JSON לא תקין" }] };
    }
  }

  const blocks = splitBlocks(trimmed);
  const questions: ParsedQuestion[] = [];
  const errors: ParseError[] = [];

  blocks.forEach((block, i) => {
    const { q, error } = parseBlock(block, i + 1);
    if (error) errors.push(error);
    else if (q) questions.push(q);
  });

  return { questions, errors };
}

function validateParsedQuestions(questions: ParsedQuestion[]): ParseResult {
  const errors: ParseError[] = [];
  questions.forEach((q, i) => {
    const block = i + 1;
    if (!q.text?.trim()) errors.push({ block, message: "חסר טקסט לשאלה" });
    if (!q.options?.length) errors.push({ block, message: "חסרות אפשרויות" });
    const correct = q.options.filter((o) => o.is_correct);
    if (q.question_type === "multiple" && correct.length === 0) {
      errors.push({ block, message: "לפחות תשובה נכונה אחת" });
    } else if (q.question_type !== "multiple" && correct.length !== 1) {
      errors.push({ block, message: "נדרשת תשובה נכונה אחת" });
    }
  });
  return { questions: errors.length ? [] : questions, errors };
}

export function toImportPayload(questions: ParsedQuestion[]): QuestionImportPayload[] {
  return questions.map((q, qi) => ({
    text: q.text,
    question_type: q.question_type,
    order_index: qi,
    points: q.points,
    options: q.options.map((o, oi) => ({
      text: o.text,
      is_correct: o.is_correct,
      order_index: oi,
    })),
  }));
}

export const QCM_FORMAT_EXAMPLE = `---
Q1 [single] (1 pt)
מהי מורכבות זמן הריצה של חיפוש בינארי?
A) O(1)
B) O(log n) *
C) O(n)
D) O(n log n)
---
Q1b [single] (2 pt)
טקסט השאלה — אפשרות עם מספר שורות:
A)
   שורה 1
   שורה 2 *
B) תשובה קצרה
---
Q2 [multiple] (2 pt)
אילו מהבאים הם עצי חיפוש?
A) AVL *
B) B-tree *
C) מערך
D) רשימה מקושרת
---
Q3 [true_false]
מחסנית (Stack) עובדת לפי עקרון FIFO
נכון
לא נכון *
---`;

export const QCM_GEMINI_PROMPT = `צור מבחן בפורמט הבא בדיוק (הפרד בין שאלות עם שורה ---):
- כתוב את השאלות בבלוק plaintext
- כותרת שאלה: Q<num> [single|multiple|true_false] (נקודות pt)
- טקסט השאלה
- אפשרויות: A) B) C) — אחרי A) אפשר כמה שורות (לא חובה בשורה אחת); * בסוף השורה הנכונה
- לנכון/לא נכון: שורות "נכון" / "לא נכון" עם * על הנכונה
שפה: עברית.`;
