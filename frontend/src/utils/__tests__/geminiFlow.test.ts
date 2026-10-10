import { describe, expect, it } from "vitest";
import { geminiFlowStep, summarizeRequest } from "../geminiFlow";
import { flagsFromRoles, isAcceptedSourceFile, rolesFromSource, splitDroppedFiles } from "../geminiSourceRole";

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
  it("filtre les extensions acceptées", () => {
    expect(isAcceptedSourceFile("Cours.PDF")).toBe(true);
    expect(isAcceptedSourceFile("image.png")).toBe(false);
    const { accepted, rejected } = splitDroppedFiles([new File([""], "a.txt"), new File([""], "b.exe")]);
    expect(accepted.map((f) => f.name)).toEqual(["a.txt"]);
    expect(rejected.map((f) => f.name)).toEqual(["b.exe"]);
  });
});
