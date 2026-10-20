import { describe, expect, it } from "vitest";
import { creditAudience, creditsForCalls, teacherCostExamples, worstCaseCalls } from "../creditCost";

describe("worstCaseCalls", () => {
  it("regroupe par 3, et par 2 dès 12 questions ou un sujet lourd", () => {
    expect(worstCaseCalls(5, false)).toBe(2);
    expect(worstCaseCalls(5, true)).toBe(3);
    expect(worstCaseCalls(12, false)).toBe(6);
    expect(worstCaseCalls(30, false)).toBe(15);
  });
});

describe("teacherCostExamples", () => {
  it("compte un crédit pour cinq appels, comme le débit enseignant", () => {
    expect(creditsForCalls(1, 5)).toBe(1);
    expect(creditsForCalls(6, 5)).toBe(2);
    expect(teacherCostExamples(5)).toEqual({ typical: 1, five: 1, twelve: 2, thirty: 3 });
  });
});

describe("creditAudience", () => {
  it("choisit le texte du rôle", () => {
    expect(creditAudience("teacher")).toBe("teacher");
    expect(creditAudience("student")).toBe("student");
    expect(creditAudience("admin")).toBe("both");
  });
});
