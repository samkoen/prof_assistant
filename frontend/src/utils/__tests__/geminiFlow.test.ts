import { describe, expect, it } from "vitest";
import { geminiFlowStep, summarizeRequest } from "../geminiFlow";
import { flagsFromRoles, isAcceptedSourceFile, rolesFromSource, splitDroppedFiles, toggleRole } from "../geminiSourceRole";

describe("toggleRole", () => {
  it("ajoute un rôle absent (cumulable)", () => {
    expect(toggleRole(["content"], "style")).toEqual(["content", "style"]);
  });
  it("retire un rôle quand un autre reste actif", () => {
    expect(toggleRole(["content", "style"], "content")).toEqual(["style"]);
  });
  it("garde le dernier rôle actif", () => {
    expect(toggleRole(["style"], "style")).toEqual(["style"]);
  });
});

describe("geminiFlowStep", () => {
  it("démarre à la demande", () => {
    expect(geminiFlowStep({ previewStep: false, generationStarted: false, generationComplete: true })).toBe(0);
  });
  it("passe à la revue quand le résumé est affiché", () => {
    expect(geminiFlowStep({ previewStep: true, generationStarted: false, generationComplete: true })).toBe(1);
  });
  it("génération en cours puis validation", () => {
    expect(geminiFlowStep({ previewStep: false, generationStarted: true, generationComplete: false })).toBe(2);
    expect(geminiFlowStep({ previewStep: false, generationStarted: true, generationComplete: true })).toBe(3);
  });
});

describe("summarizeRequest", () => {
  it("additionne les questions et compte les fichiers par usage", () => {
    const s = summarizeRequest(
      [{ questionCount: 3 }, { questionCount: 5 }],
      [
        { use_as_content: true, use_as_style: false },
        { use_as_content: true, use_as_style: true },
      ],
    );
    expect(s).toEqual({ questions: 8, series: 2, files: 2, contentFiles: 2, styleFiles: 1 });
  });
});

describe("rôles des sources", () => {
  it("convertit indicateurs ↔ rôles", () => {
    expect(rolesFromSource({ use_as_content: true, use_as_style: true })).toEqual(["content", "style"]);
    expect(flagsFromRoles(["style"])).toEqual({ use_as_content: false, use_as_style: true });
  });
  it("refuse une sélection vide", () => {
    expect(flagsFromRoles([])).toBeNull();
  });
  it("accepte tous les formats, y compris image et Excel", () => {
    expect(isAcceptedSourceFile("Cours.PDF")).toBe(true);
    expect(isAcceptedSourceFile("image.png")).toBe(true);
    expect(isAcceptedSourceFile("mix.xlsx")).toBe(true);
    expect(isAcceptedSourceFile("  ")).toBe(false);
    const files = [new File([""], "a.txt"), new File([""], "b.png"), new File([""], "c.xlsx")];
    const { accepted, rejected } = splitDroppedFiles(files);
    expect(accepted.map((f) => f.name)).toEqual(["a.txt", "b.png", "c.xlsx"]);
    expect(rejected).toEqual([]);
  });
});
