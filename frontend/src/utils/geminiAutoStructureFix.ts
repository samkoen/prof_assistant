import type { ParseError } from "./qcmImportParser";
import { GEMINI_FIX_STARS_REFINE_MESSAGE } from "./geminiParseErrors";

/** Max de passes auto-fix par cycle de texte brut. */
export const MAX_AUTO_STRUCTURE_FIX_ATTEMPTS = 2;

type FixRule = {
  messages: ReadonlySet<string>;
  /** Instruction de correction pour Gemini (hébreu). */
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
      "בשאלות בחירה מרובה: סמנו * על כל האפשרויות הנכונות (לפחות אחת) — בדיוק לפי הפורמט",
  },
  {
    messages: STAR_TOO_MANY_SINGLE,
    instruction:
      "בשאלות בחירה יחידה: השאירו * רק על אפשרות אחת נכונה — הסירו * מיותרות",
  },
  {
    messages: TF_TWO_OPTIONS,
    instruction:
      "בשאלות נכון/לא נכון: בדיוק שתי אפשרויות (נכון / לא נכון) עם * על הנכונה בלבד",
  },
  {
    messages: NO_OPTIONS,
    instruction:
      "לכל שאלה חובה אפשרויות A) B) C) (ו־D) אם צריך) בשורות נפרדות לפי הפורמט",
  },
  {
    messages: MISSING_TEXT,
    instruction: "לכל שאלה חייב להיות טקסט שאלה מלא אחרי שורת Qn — לפני האפשרויות",
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
  return ` (שאלות: ${blocks.map((b) => `Q${b}`).join(", ")})`;
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
    "יש שגיאות פורמט בפלט האחרון. תקן אותן בלבד — בלי לשנות את תוכן השאלות:",
    ...parts.map((p, i) => `${i + 1}. ${p}`),
    "החזר את כל מערך השאלות המלא בפורמט הנדרש.",
  ].join("\n");
}
