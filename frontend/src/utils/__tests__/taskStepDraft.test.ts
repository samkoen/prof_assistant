import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import { taskStepDraftError } from "../taskStepDraft";

describe("taskStepDraftError", () => {
  it("exige une description", () => {
    expect(taskStepDraftError({ title: "כותרת", instructions: "  " })).toBe(he.taskStepDescriptionRequired);
  });

  it("accepte un titre et une description", () => {
    expect(taskStepDraftError({ title: "כותרת", instructions: "תיאור" })).toBeNull();
  });
});
