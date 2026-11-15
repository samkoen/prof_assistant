import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import { canSendTutorMessage, fullExplanationAction, tutorStarterActions } from "../tutorQuickActions";

describe("tutorStarterActions", () => {
  it("propose « pourquoi faux » sur une réponse fausse", () => {
    const actions = tutorStarterActions(false);
    expect(actions[0]).toEqual({ action: "why_wrong", label: he.tutorQuickWhyWrong });
    expect(actions.map((a) => a.action)).toEqual(["why_wrong", "step_by_step", "similar_example", "quiz_me"]);
  });

  it("reste ouvert sur une réponse juste (trouvée peut-être par hasard)", () => {
    expect(tutorStarterActions(true)[0].action).toBe("why_right");
  });

  it("question ouverte : pas de « pourquoi »", () => {
    expect(tutorStarterActions(null).map((a) => a.action)).toEqual(["step_by_step", "similar_example", "quiz_me"]);
  });

  it("l'explication complète a son libellé", () => {
    expect(fullExplanationAction.label).toBe(he.tutorQuickFullExplanation);
  });
});

describe("canSendTutorMessage", () => {
  it("refuse un texte vide, un envoi en cours ou un quota épuisé", () => {
    expect(canSendTutorMessage("  ", 5, false)).toBe(false);
    expect(canSendTutorMessage("שאלה", 5, true)).toBe(false);
    expect(canSendTutorMessage("שאלה", 0, false)).toBe(false);
    expect(canSendTutorMessage("שאלה", 1, false)).toBe(true);
  });
});
