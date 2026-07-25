import { describe, expect, it } from "vitest";
import {
  buildAutoStructureFixPrompt,
  canAutoFixStructure,
  classifiableStructureErrors,
} from "../geminiAutoStructureFix";

describe("geminiAutoStructureFix", () => {
  it("détecte les erreurs * manquants", () => {
    const errors = [
      { block: 1, message: "נדרשת תשובה נכונה אחת (סמן ב-*)" },
      { block: 2, message: "erreur inconnue" },
    ];
    expect(classifiableStructureErrors(errors)).toHaveLength(1);
    expect(canAutoFixStructure(errors)).toBe(true);
  });

  it("retourne null si rien n'est classifiable", () => {
    expect(buildAutoStructureFixPrompt([{ block: 1, message: "autre" }])).toBeNull();
    expect(canAutoFixStructure([])).toBe(false);
  });

  it("construit un prompt de correction ciblé", () => {
    const prompt = buildAutoStructureFixPrompt([
      { block: 3, message: "נדרשת תשובה נכונה אחת (סמן ב-*)" },
      { block: 1, message: "לא נמצאו אפשרויות תשובה" },
    ]);
    expect(prompt).toContain("יש שגיאות פורמט");
    expect(prompt).toContain("Q1");
    expect(prompt).toContain("Q3");
    expect(prompt).toContain("A) B) C)");
  });
});
