import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import { aiPromptCatalogKeys, aiPromptLabel } from "../aiPromptLabels";
import { aiPromptUsage } from "../aiPromptUsage";

describe("aiPromptLabel", () => {
  it("retourne le libellé hébreu pour une clé connue", () => {
    expect(aiPromptLabel("open_eval.user")).toBe(he.aiPromptOpenEvalUser);
    expect(aiPromptLabel("open_model.system")).toBe(he.aiPromptOpenModelSystem);
  });

  it("retourne la clé brute si inconnue", () => {
    expect(aiPromptLabel("unknown.template")).toBe("unknown.template");
  });
});

describe("aiPromptUsage", () => {
  it("décrit la page et le bouton pour chaque modèle du catalogue", () => {
    const keys = aiPromptCatalogKeys();
    expect(keys).toHaveLength(19);
    for (const key of keys) {
      const usage = aiPromptUsage(key);
      expect(usage.length, key).toBeGreaterThan(20);
    }
  });

  it("pointe l'évaluation ouverte vers la revue et le bouton dédié", () => {
    expect(aiPromptUsage("open_eval.user")).toContain("הערכת התשובה");
    expect(aiPromptUsage("open_model.user")).toContain("יצירת תשובה לדוגמה עם AI");
  });

  it("retourne vide si la clé est inconnue", () => {
    expect(aiPromptUsage("unknown.template")).toBe("");
  });
});
