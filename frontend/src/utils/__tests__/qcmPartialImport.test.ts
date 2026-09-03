import { describe, expect, it } from "vitest";
import { parseQcmText } from "../qcmImportParser";
import {
  canImportValidQuestions,
  partialImportCounts,
  remainingPasteAfterImport,
  shouldClearPasteAfterImport,
} from "../qcmPartialImport";

const MIXED = `
Q1 [single] (1 pt)
מהי בירת ישראל?
A) תל אביב
B) * ירושלים
C) חיפה
---
Q2 [single]
שאלה בלי אפשרויות
`;

describe("qcmPartialImport", () => {
  it("garde les questions valides à côté des erreurs", () => {
    const result = parseQcmText(MIXED);
    expect(result.questions).toHaveLength(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(partialImportCounts(result)).toEqual({ valid: 1, skipped: result.errors.length });
    expect(canImportValidQuestions(result)).toBe(true);
    expect(shouldClearPasteAfterImport(result)).toBe(false);
  });

  it("retire les questions déjà importées du collage", () => {
    const remaining = remainingPasteAfterImport(MIXED);
    expect(remaining).toContain("שאלה בלי אפשרויות");
    expect(remaining).not.toContain("מהי בירת ישראל");
    expect(canImportValidQuestions(parseQcmText(remaining))).toBe(false);
  });

  it("vide le collage seulement si tout est valide", () => {
    const valid = `
Q1 [single]
שאלה
A) * אחת
B) שתיים
`;
    const result = parseQcmText(valid);
    expect(result.errors).toEqual([]);
    expect(shouldClearPasteAfterImport(result)).toBe(true);
    expect(remainingPasteAfterImport(valid)).toBe("");
  });

  it("refuse l'import s'il n'y a aucune question valide", () => {
    const result = parseQcmText(`
Q1 [single]
שאלה בלי אפשרויות
`);
    expect(result.questions).toHaveLength(0);
    expect(canImportValidQuestions(result)).toBe(false);
  });
});
