import { describe, expect, it } from "vitest";
import { STUDENT_AI_PRODUCT, TEACHER_AI_PRODUCT } from "../aiCredits";
import { DEFAULT_PUBLIC_PACKS, packsForProduct, parsePublicCatalog } from "../publicCatalog";

describe("parsePublicCatalog", () => {
  it("garde les forfaits valides et ignore le reste", () => {
    const parsed = parsePublicCatalog({
      packs: [
        { code: "student_20", product: "student_ai", credits: 20, price_ils: 19 },
        { code: "bad", product: "other", credits: 1, price_ils: 1 },
      ],
    });
    expect(parsed).toEqual([
      { code: "student_20", product: "student_ai", credits: 20, price_ils: 19 },
    ]);
  });

  it("refuse un corps sans forfait", () => {
    expect(parsePublicCatalog({})).toBeNull();
    expect(parsePublicCatalog({ packs: [] })).toBeNull();
  });
});

describe("packsForProduct", () => {
  it("sépare les forfaits élève et enseignant", () => {
    expect(packsForProduct(DEFAULT_PUBLIC_PACKS, STUDENT_AI_PRODUCT).map((pack) => pack.price_ils)).toEqual([19, 45]);
    expect(packsForProduct(DEFAULT_PUBLIC_PACKS, TEACHER_AI_PRODUCT).map((pack) => pack.price_ils)).toEqual([29, 69]);
  });
});
