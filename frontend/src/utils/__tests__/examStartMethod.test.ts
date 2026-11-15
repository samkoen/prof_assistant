import { describe, expect, it } from "vitest";
import { addPanelOpenInitially, parseStartMethod } from "../examStartMethod";

describe("parseStartMethod", () => {
  it("accepte les méthodes connues", () => {
    expect(parseStartMethod("gemini")).toBe("gemini");
    expect(parseStartMethod("paste")).toBe("paste");
    expect(parseStartMethod("manual")).toBe("manual");
  });
  it("ignore une valeur absente ou inconnue", () => {
    expect(parseStartMethod(null)).toBeNull();
    expect(parseStartMethod("hack")).toBeNull();
  });
});

describe("addPanelOpenInitially", () => {
  it("ouvre l'ajout pour un examen vide modifiable", () => {
    expect(addPanelOpenInitially(0, true, null)).toBe(true);
  });
  it("ouvre l'ajout quand une méthode de départ est demandée", () => {
    expect(addPanelOpenInitially(4, true, "paste")).toBe(true);
  });
  it("reste replié pour un examen déjà rempli", () => {
    expect(addPanelOpenInitially(4, true, null)).toBe(false);
  });
  it("jamais ouvert si l'examen n'est pas modifiable", () => {
    expect(addPanelOpenInitially(0, false, "gemini")).toBe(false);
  });
});
