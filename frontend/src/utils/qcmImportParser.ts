import { stripEditorBidiMarks } from "./examQuestionsLanguage";

export type QuestionType = "single" | "multiple" | "true_false" | "open";

export interface ParsedQuestionOption {
  text: string;
  is_correct: boolean;
}

export interface ParsedQuestion {
  text: string;
  question_type: QuestionType;
  points: number;
  options: ParsedQuestionOption[];
  model_answer?: string;
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
  model_answer?: string | null;
}

const HEADER_RE =
  /^(?:Q?\d+[\.\):]?\s*)?(?:\[(single|multiple|true_false|tf|vrai_faux|open)\])?(?:\s*\((\d+(?:\.\d+)?)\s*(?:pt|pts|נק)?\))?\s*$/i;

const OPTION_START_RE = /^([A-Z])\)\s*(.*)$/i;
const HEBREW_OPTION_RE = /^([א-ת])\)\s*(.*)$/u;
/** Ligne dédiée : * ou ✓ seul (réponse correcte avant contenu multiligne). */
const MARKER_ONLY_RE = /^[*✓✔★]\s*$/u;
const CORRECT_SUFFIX_RE = /\s*(?:[\(\[]\s*)?(?:תשובה\s*נכונה|correct)(?:\s*[\)\]])?\s*$/iu;
/** Vrai/True/Faux/False — uniquement ligne entière (pas « retourner vrai » dans du pseudo-code). */
const STANDALONE_TF_MARK_RE =
  /^(?:[\(\[]\s*)?(?:vrai|faux|true|false)(?:\s*[\)\]])?\s*[*✓✔★]?\s*$/iu;
const CORRECT_SUFFIX_HE_OK = /(?:^|[\(\[]\s*)נכון(?:\s*[\)\]])?\s*$/u;
const TRAILING_MARK_RE = /\s*[*✓✔★]\s*$/u;
const TF_RE =
  /^(?:Vrai|Faux|True|False|נכון|לא נכון|לא|Верно|Неверно|Да|Нет)\s*(\*)?\s*$/iu;

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
  if (t === "open") return "open";
  return "single";
}

const TYPE_TAG_RE = /\[(single|multiple|true_false|tf|vrai_faux|open)\]/i;
const HEADER_PREFIX_RE =
  /^(?:Q\d+[\.\):]?\s*)?(?:\[(?:single|multiple|true_false|tf|vrai_faux|open)\])?\s*(?:\((\d+(?:\.\d+)?)\s*(?:pt|pts|נק)?\))?\s*/i;

type BlockHeader = {
  type: QuestionType;
  typeExplicit: boolean;
  points: number;
  rawStart: number;
};

function taggedTypeIn(line: string): QuestionType | undefined {
  const m = TYPE_TAG_RE.exec(line);
  return m ? normalizeType(m[1]) : undefined;
}

function headerPoints(line: string): number | undefined {
  const m = /\((\d+(?:\.\d+)?)\s*(?:pt|pts|נק)?\)/i.exec(line);
  return m ? parseFloat(m[1]) : undefined;
}

function isStandaloneHeader(line: string): boolean {
  const headerMatch = line.match(HEADER_RE);
  return Boolean(headerMatch && (headerMatch[1] || headerMatch[2] || /^Q?\d/i.test(line)));
}

function splitBlocks(raw: string): string[] {
  return raw
    .split(/\n---+\n|^---+\n|\n---+\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean);
}

const CORRECT_SUFFIX_HE_PARENS = /\s*[\(\[]\s*נכון\s*[\)\]]\s*$/u;

function hasHebrewCorrectSuffix(trimmed: string): boolean {
  if (/לא\s*נכון/i.test(trimmed)) return false;
  return CORRECT_SUFFIX_HE_OK.test(trimmed) || CORRECT_SUFFIX_HE_PARENS.test(trimmed);
}

function stripHebrewCorrectSuffix(trimmed: string): string {
  return trimmed
    .replace(CORRECT_SUFFIX_HE_PARENS, "")
    .replace(CORRECT_SUFFIX_HE_OK, "")
    .trimEnd();
}

function stripStandaloneTfMarker(trimmed: string): string {
  return trimmed.replace(TRAILING_MARK_RE, "").replace(/^\*+\s*/, "").trim();
}

function stripCorrectMarker(line: string): { text: string; marked: boolean } {
  const trimmed = line.trim();
  if (MARKER_ONLY_RE.test(trimmed)) return { text: "", marked: true };
  const prefixStar = /^\*\s+(.+)$/.exec(trimmed);
  if (prefixStar) return { text: prefixStar[1].trim(), marked: true };
  if (STANDALONE_TF_MARK_RE.test(trimmed)) {
    return { text: stripStandaloneTfMarker(trimmed), marked: true };
  }
  if (CORRECT_SUFFIX_RE.test(trimmed) || hasHebrewCorrectSuffix(trimmed)) {
    const text = CORRECT_SUFFIX_RE.test(trimmed)
      ? trimmed.replace(CORRECT_SUFFIX_RE, "").trimEnd()
      : stripHebrewCorrectSuffix(trimmed);
    return { text, marked: true };
  }
  if (TRAILING_MARK_RE.test(line.trimEnd())) {
    return { text: line.replace(TRAILING_MARK_RE, "").trimEnd(), marked: true };
  }
  return { text: line, marked: false };
}

const HEBREW_OPTION_MAP: Record<string, string> = {
  א: "A",
  ב: "B",
  ג: "C",
  ד: "D",
  ה: "E",
};

function normalizeHebrewOptionLine(line: string): string {
  const m = HEBREW_OPTION_RE.exec(line.trim());
  if (!m) return line;
  const lat = HEBREW_OPTION_MAP[m[1]];
  return lat ? `${lat}) ${m[2]}` : line;
}

function normalizeGeminiQcmText(raw: string): string {
  let text = stripEditorBidiMarks(raw.trim().replace(/^\uFEFF/, ""));
  if (text.startsWith("```")) {
    text = text.replace(/^```[\w]*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return text
    .split("\n")
    .map((line) => {
      let out = line.replace(/^\*\*([A-Z])\)\*\*/i, "$1)").replace(/^\*\*([A-Z])\)/i, "$1)");
      out = out.replace(/^([A-Z])\)\s*[*✓✔★]\s+/i, "$1) * ");
      out = normalizeHebrewOptionLine(out);
      return out;
    })
    .join("\n");
}

function collectOptionText(block: string[]): { text: string; is_correct: boolean } {
  let is_correct = false;
  const parts: string[] = [];
  for (const line of block) {
    const { text, marked } = stripCorrectMarker(line.trimEnd());
    if (marked) is_correct = true;
    if (text.trim()) parts.push(text);
  }
  return { text: trimEdgeBlankLines(parts).join("\n"), is_correct };
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
    const { text, is_correct } = collectOptionText(block);
    if (text || is_correct) options.push({ text: text || " ", is_correct });
    chunk = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const normalized = normalizeHebrewOptionLine(trimmed);
    const start = normalized
      ? OPTION_START_RE.exec(normalized) ?? HEBREW_OPTION_RE.exec(normalized)
      : null;
    if (start) {
      flush();
      const rest = start[2].trim();
      if (rest.startsWith("*")) {
        const after = rest.slice(1).trim();
        chunk.push("*");
        if (after) chunk.push(after);
      } else if (rest) {
        chunk.push(rest);
      }
      continue;
    }
    if (trimmed && TF_RE.test(trimmed)) return [];
    chunk.push(line.trimEnd());
  }
  flush();
  return options;
}

function isOptionStartLine(line: string): boolean {
  const t = line.trim();
  return OPTION_START_RE.test(t) || HEBREW_OPTION_RE.test(t) || TF_RE.test(t);
}

function findOptionStartIndex(lines: string[], from: number): number {
  for (let i = from; i < lines.length; i++) {
    if (isOptionStartLine(lines[i])) return i;
  }
  return -1;
}

function isAnswerMarker(line: string): boolean {
  return /^(ANSWER|MODEL|תשובה)\s*:/i.test(line.trim());
}

function stripLeadingHeader(line: string): string {
  const trimmed = line.trim();
  if (!/^(?:Q\d+|\[(?:single|multiple|true_false|tf|vrai_faux|open)\])/i.test(trimmed)) {
    return line;
  }
  return trimmed.replace(HEADER_PREFIX_RE, "").trimEnd();
}

function readBlockHeader(rawLines: string[], first: string): BlockHeader {
  if (isStandaloneHeader(first)) {
    const headerMatch = first.match(HEADER_RE);
    const headerIdx = rawLines.findIndex((l) => l.trim() === first);
    return {
      type: headerMatch?.[1] ? normalizeType(headerMatch[1]) : "single",
      typeExplicit: Boolean(headerMatch?.[1]),
      points: headerMatch?.[2] ? parseFloat(headerMatch[2]) : 1,
      rawStart: headerIdx >= 0 ? headerIdx + 1 : 1,
    };
  }
  const tagged = taggedTypeIn(first);
  return {
    type: tagged ?? "single",
    typeExplicit: tagged !== undefined,
    points: headerPoints(first) ?? 1,
    rawStart: 0,
  };
}

function parseOpenBlock(
  rawLines: string[],
  rawStart: number,
  points: number,
  blockIndex: number,
): { q?: ParsedQuestion; error?: ParseError } {
  const rest = rawLines.slice(rawStart).map((line, i) => (i === 0 ? stripLeadingHeader(line) : line));
  const answerIdx = rest.findIndex((l) => isAnswerMarker(l));
  const textLines = answerIdx >= 0 ? rest.slice(0, answerIdx) : rest;
  const text = trimEdgeBlankLines(textLines).join("\n").trim();
  if (!text) {
    return { error: { block: blockIndex, message: "חסר טקסט לשאלה" } };
  }
  let model_answer: string | undefined;
  if (answerIdx >= 0) {
    const marker = rest[answerIdx].trim();
    const afterColon = marker.replace(/^(ANSWER|MODEL|תשובה)\s*:/i, "").trim();
    const extra = trimEdgeBlankLines(rest.slice(answerIdx + 1)).join("\n").trim();
    model_answer = [afterColon, extra].filter(Boolean).join("\n").trim() || undefined;
  }
  return { q: { text, question_type: "open", points, options: [], model_answer } };
}

function collectTrueFalseOptions(optionSection: string[]): ParsedQuestionOption[] {
  const options: ParsedQuestionOption[] = [];
  for (const line of optionSection.map((l) => l.trim()).filter(Boolean)) {
    const tf = TF_RE.exec(line);
    if (!tf) continue;
    const key = line.replace(/\*/g, "").trim().toLowerCase();
    options.push({ text: TF_LABELS[key] ?? line.replace(/\*/g, "").trim(), is_correct: !!tf[1] });
  }
  return options;
}

function choiceTypeError(
  type: QuestionType,
  options: ParsedQuestionOption[],
  blockIndex: number,
): ParseError | undefined {
  const correct = options.filter((o) => o.is_correct);
  if (type === "true_false" && options.length !== 2) {
    return { block: blockIndex, message: "שאלת נכון/לא נכון דורשת 2 אפשרויות" };
  }
  if (type !== "multiple" && correct.length === 0) {
    return { block: blockIndex, message: "נדרשת תשובה נכונה אחת (סמן ב-*)" };
  }
  if (type !== "multiple" && correct.length > 1) {
    return { block: blockIndex, message: "בחירה יחידה: יותר מתשובה נכונה אחת (סמן * רק על אפשרות אחת)" };
  }
  if (type === "multiple" && correct.length === 0) {
    return { block: blockIndex, message: "לפחות תשובה נכונה אחת (סמן ב-*)" };
  }
  return undefined;
}

function missingOptionsResult(
  header: BlockHeader,
  rawLines: string[],
  blockIndex: number,
): { q?: ParsedQuestion; error?: ParseError } {
  if (!header.typeExplicit) {
    return parseOpenBlock(rawLines, header.rawStart, header.points, blockIndex);
  }
  return { error: { block: blockIndex, message: "לא נמצאו אפשרויות תשובה" } };
}

function parseChoiceBlock(
  rawLines: string[],
  header: BlockHeader,
  optionStart: number,
  blockIndex: number,
): { q?: ParsedQuestion; error?: ParseError } {
  const text = trimEdgeBlankLines(rawLines.slice(header.rawStart, optionStart)).join("\n").trim();
  if (!text) {
    return { error: { block: blockIndex, message: "חסר טקסט לשאלה" } };
  }
  const optionSection = rawLines.slice(optionStart);
  let options = parseLetterOptions(optionSection);
  let type = header.type;
  if (options.length === 0) {
    options = collectTrueFalseOptions(optionSection);
    if (options.length) type = "true_false";
  }
  if (options.length === 0) {
    return missingOptionsResult(header, rawLines, blockIndex);
  }
  const error = choiceTypeError(type, options, blockIndex);
  return error ? { error } : { q: { text, question_type: type, points: header.points, options } };
}

function parseBlock(block: string, blockIndex: number): { q?: ParsedQuestion; error?: ParseError } {
  const rawLines = block.split("\n").map((l) => l.trimEnd());
  const lines = rawLines.map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { error: { block: blockIndex, message: "בלוק ריק" } };
  }
  const header = readBlockHeader(rawLines, lines[0]);
  if (header.type === "open") {
    return parseOpenBlock(rawLines, header.rawStart, header.points, blockIndex);
  }
  const optionStart = findOptionStartIndex(rawLines, header.rawStart);
  if (optionStart < 0) {
    return missingOptionsResult(header, rawLines, blockIndex);
  }
  return parseChoiceBlock(rawLines, header, optionStart, blockIndex);
}

export function parseQcmText(raw: string): ParseResult {
  const trimmed = normalizeGeminiQcmText(raw);
  if (!trimmed) {
    return { questions: [], errors: [] };
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
    if (q.question_type === "open") return;
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
    model_answer: q.model_answer ?? null,
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
Q1c [single] (2 pt)
איזה עץ AVL מתקבל אחרי הוספת 7?
A)
*
      10
     /  \\
    5    15
B)
      10
     /  \\
    5    12
C)
      12
     /  \\
    5    15
D)
      10
     /  \\
    7    15
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
---
Q4 [open] (2 pt)
הסבירו בקצרה איך עובד חיפוש בינארי.
ANSWER:
חיפוש בינארי מחלק את המערך הממוין לשניים בכל צעד עד למציאת הערך.
---`;

export const QCM_GEMINI_PROMPT = `צור מבחן בפורמט הבא בדיוק (הפרד בין שאלות עם שורה ---):
- כותרת: Q<num> [single] (1 pt) — אפשרויות A) B) C) D) בלבד (לא א) ב))
- אחרי A) מותרות שורות נוספות; עץ AVL: / = שמאל, \\ = ימין
- סימון נכון: שורה * בלבד אחרי A), או * בסוף השורה האחרונה של האפשרות (לא * בתוך הטקסט)
- ב-single: בדיוק אפשרות אחת עם *
- לנכון/לא נכון: "נכון" / "לא נכון" עם * על הנכונה
- לשאלה פתוחה [open]: טקסט השאלה בלבד, בלי A) B) C)
שפה: עברית.`;
