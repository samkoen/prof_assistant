import { describe, expect, it } from "vitest";
import { aiPromptLabel } from "../aiPromptLabels";
import { he } from "../../i18n/he";

describe("aiPromptLabel", () => {
  it("retourne le libellé hébreu pour une clé connue", () => {
    expect(aiPromptLabel("open_eval.user")).toBe(he.aiPromptOpenEvalUser);
    expect(aiPromptLabel("open_model.system")).toBe(he.aiPromptOpenModelSystem);
  });

  it("retourne la clé brute si inconnue", () => {
    expect(aiPromptLabel("unknown.template")).toBe("unknown.template");
  });
});
