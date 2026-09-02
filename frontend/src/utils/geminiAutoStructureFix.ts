import type { ParseError } from "./qcmImportParser";
import { GEMINI_FIX_STARS_REFINE_MESSAGE } from "./geminiParseErrors";

/** Max de passes auto-fix par cycle de texte brut. */
export const MAX_AUTO_STRUCTURE_FIX_ATTEMPTS = 2;

type FixRule = {
  messages: ReadonlySet<string>;
  /** Instruction de correction pour l'IA (anglais). */
  instruction: string;
};

const STAR_MISSING_SINGLE = new Set([
  "נדרשת תשובה נכונה אחת (סמן ב-*)",
  "נדרשת תשובה נכונה אחת",
]);

const STAR_MISSING_MULTIPLE = new Set([
  "לפחות תשובה נכונה אחת (סמן ב-*)",
  "לפחות תשובה נכונה אחת",
]);

const STAR_TOO_MANY_SINGLE = new Set([
  "בחירה יחידה: יותר מתשובה נכונה אחת (סמן * רק על אפשרות אחת)",
]);

const TF_TWO_OPTIONS = new Set(["שאלת נכון/לא נכון דורשת 2 אפשרויות"]);

const NO_OPTIONS = new Set(["לא נמצאו אפשרויות תשובה", "חסרות אפשרויות"]);

const MISSING_TEXT = new Set(["חסר טקסט לשאלה"]);

const FIX_RULES: FixRule[] = [
  {
    messages: STAR_MISSING_SINGLE,
    instruction: GEMINI_FIX_STARS_REFINE_MESSAGE,
  },
  {
    messages: STAR_MISSING_MULTIPLE,
    instruction:
      "On multiple-choice questions, mark * on every correct option (at least one) — exactly as in the format",
  },
  {
    messages: STAR_TOO_MANY_SINGLE,
    instruction:
      "On single-choice questions, keep * on exactly one correct option — remove extra * marks",
  },
  {
    messages: TF_TWO_OPTIONS,
    instruction:
      "On true/false questions: exactly two options (true / false) with * on the correct one only",
  },
  {
    messages: NO_OPTIONS,
    instruction:
      "Choice questions (single/multiple/true_false) must have A) B) C) options. Open questions ([open]) need question text only — no A) B)",
  },
  {
    messages: MISSING_TEXT,
    instruction: "Every question must have full question text after the Qn line — before the options",
  },
];

function matchingRule(message: string): FixRule | undefined {
  return FIX_RULES.find((rule) => rule.messages.has(message));
}

/** Erreurs pour lesquelles on a une demande de correction claire. */
export function classifiableStructureErrors(errors: ParseError[]): ParseError[] {
  return errors.filter((e) => matchingRule(e.message));
}

export function canAutoFixStructure(errors: ParseError[]): boolean {
  return classifiableStructureErrors(errors).length > 0;
}

function questionRefs(errors: ParseError[]): string {
  const blocks = [...new Set(errors.map((e) => e.block).filter((b) => b > 0))].sort(
    (a, b) => a - b,
  );
  if (blocks.length === 0) return "";
  return ` (questions: ${blocks.map((b) => `Q${b}`).join(", ")})`;
}

/**
 * Construit un prompt de refine ciblé, ou null si aucune erreur n'est classifiable.
 * Une instruction par type d'erreur, avec numéros de questions si connus.
 */
export function buildAutoStructureFixPrompt(errors: ParseError[]): string | null {
  const classifiable = classifiableStructureErrors(errors);
  if (classifiable.length === 0) return null;

  const byRule = new Map<FixRule, ParseError[]>();
  for (const err of classifiable) {
    const rule = matchingRule(err.message);
    if (!rule) continue;
    const list = byRule.get(rule) ?? [];
    list.push(err);
    byRule.set(rule, list);
  }

  const parts: string[] = [];
  for (const [rule, errs] of byRule) {
    parts.push(`${rule.instruction}${questionRefs(errs)}`);
  }

  return [
    "The last output has format errors. Fix those only — do not change question content:",
    ...parts.map((p, i) => `${i + 1}. ${p}`),
    "Return the full question set in the required format.",
  ].join("\n");
}
