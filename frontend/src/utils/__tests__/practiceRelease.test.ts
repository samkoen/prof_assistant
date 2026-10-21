import { describe, expect, it } from "vitest";
import { practiceReleaseActions } from "../practiceRelease";

describe("practiceReleaseActions", () => {
  it("cache les boutons hors תרגול et משימה", () => {
    expect(practiceReleaseActions({ practice: false, status: "draft", hasContent: true })).toEqual({
      deploy: false,
      deployBlocked: false,
      block: false,
      unlock: false,
    });
  });

  it("propose l'envoi quand le contenu est prêt, sinon le bouton est bloqué", () => {
    expect(practiceReleaseActions({ practice: true, status: "draft", hasContent: false }).deployBlocked).toBe(true);
    expect(practiceReleaseActions({ practice: true, status: "draft", hasContent: true }).deploy).toBe(true);
  });

  it("bloque la note seulement après l'envoi", () => {
    const live = practiceReleaseActions({ practice: true, status: "active", hasContent: true, gradingLocked: false });
    expect(live.block).toBe(true);
    expect(live.deploy).toBe(false);
    expect(live.unlock).toBe(false);
  });

  it("propose de rendre la note quand elle est bloquée, au lieu de renvoyer", () => {
    const locked = practiceReleaseActions({ practice: true, status: "active", hasContent: true, gradingLocked: true });
    expect(locked.block).toBe(false);
    expect(locked.deploy).toBe(false);
    expect(locked.unlock).toBe(true);
  });

  it("n'affiche jamais plus d'une action à la fois", () => {
    const states = [
      { status: "draft" as const, hasContent: true },
      { status: "draft" as const, hasContent: false },
      { status: "active" as const, hasContent: true },
      { status: "active" as const, hasContent: true, gradingLocked: true },
      { status: "closed" as const, hasContent: true },
    ];
    for (const state of states) {
      const shown = Object.values(practiceReleaseActions({ practice: true, ...state })).filter(Boolean);
      expect(shown.length).toBeLessThanOrEqual(1);
    }
  });
});
