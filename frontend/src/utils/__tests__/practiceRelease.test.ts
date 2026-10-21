import { describe, expect, it } from "vitest";
import { practiceReleaseActions } from "../practiceRelease";

describe("practiceReleaseActions", () => {
  it("cache les boutons hors תרגול et משימה", () => {
    expect(practiceReleaseActions({ practice: false, status: "draft", hasContent: true })).toEqual({
      deploy: false,
      deployBlocked: false,
      block: false,
    });
  });

  it("propose l'envoi quand le contenu est prêt, sinon le bouton est bloqué", () => {
    expect(practiceReleaseActions({ practice: true, status: "draft", hasContent: false }).deployBlocked).toBe(true);
    expect(practiceReleaseActions({ practice: true, status: "draft", hasContent: true }).deploy).toBe(true);
  });

  it("bloque la note seulement après l'envoi, et permet de renvoyer ensuite", () => {
    const live = practiceReleaseActions({ practice: true, status: "active", hasContent: true, gradingLocked: false });
    expect(live.block).toBe(true);
    expect(live.deploy).toBe(false);
    const locked = practiceReleaseActions({ practice: true, status: "active", hasContent: true, gradingLocked: true });
    expect(locked.block).toBe(false);
    expect(locked.deploy).toBe(true);
  });
});
