import { describe, expect, it } from "vitest";
import { displayRefineText, isRefineUserContent } from "../geminiRefineMarkers";

describe("geminiRefineMarkers", () => {
  it("extrait le texte prof des prompts anglais et hébreu", () => {
    expect(isRefineUserContent("Teacher update request:\nתוסיף שאלה\n\nReturn the full")).toBe(
      true,
    );
    expect(displayRefineText("Teacher update request:\nתוסיף שאלה\n\nReturn the full")).toBe(
      "תוסיף שאלה",
    );
    expect(isRefineUserContent("בקשת עדכון מהמורה:\nold\n\nשאר")).toBe(true);
    expect(displayRefineText("בקשת עדכון מהמורה:\nold\n\nשאר")).toBe("old");
    expect(isRefineUserContent("Generate exam questions.")).toBe(false);
  });
});
