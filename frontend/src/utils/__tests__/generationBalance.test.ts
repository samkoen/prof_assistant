import { describe, expect, it } from "vitest";
import { shouldRefreshBalance } from "../generationBalance";

describe("shouldRefreshBalance", () => {
  it("rafraîchit à la fin d'une génération", () => {
    expect(shouldRefreshBalance(true, false)).toBe(true);
  });
  it("ne rafraîchit pas au démarrage ni au repos", () => {
    expect(shouldRefreshBalance(false, true)).toBe(false);
    expect(shouldRefreshBalance(false, false)).toBe(false);
    expect(shouldRefreshBalance(true, true)).toBe(false);
  });
});
