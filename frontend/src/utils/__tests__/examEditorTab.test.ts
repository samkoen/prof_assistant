import { describe, expect, it } from "vitest";
import { initialEditorTab, resolveEditorTab } from "../examEditorTab";

describe("examEditorTab", () => {
  it("ouvre l'ajout pour un examen vide modifiable", () => {
    expect(initialEditorTab(0, true)).toBe("add");
  });
  it("ouvre les questions sinon", () => {
    expect(initialEditorTab(3, true)).toBe("questions");
    expect(initialEditorTab(0, false)).toBe("questions");
  });
  it("garde le choix explicite de l'utilisateur", () => {
    expect(resolveEditorTab("settings", 0, true)).toBe("settings");
  });
  it("replie « ajout » si l'examen n'est pas modifiable", () => {
    expect(resolveEditorTab("add", 2, false)).toBe("questions");
  });
});
