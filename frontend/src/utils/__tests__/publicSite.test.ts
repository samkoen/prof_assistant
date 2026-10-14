import { describe, expect, it } from "vitest";
import { businessContactLines, contactHref, nextDemoIndex, publicOffers } from "../publicSite";

describe("publicOffers", () => {
  it("publie les quatre services vendus", () => {
    const offers = publicOffers();
    expect(offers.map((offer) => offer.id)).toEqual([
      "assignments",
      "exams",
      "explanations",
      "credits",
    ]);
    expect(offers.every((offer) => offer.title && offer.text)).toBe(true);
  });
});

describe("businessContactLines", () => {
  it("garde l'email et masque un téléphone ou une adresse vides", () => {
    const lines = businessContactLines({ email: "a@b.co", phone: "  ", address: "" });
    expect(lines).toEqual([{ kind: "email", value: "a@b.co" }]);
  });

  it("affiche l'adresse puis le téléphone quand ils sont renseignés", () => {
    const lines = businessContactLines({
      email: "a@b.co",
      phone: "050-0000000",
      address: "רחוב הרצל 1, תל אביב",
    });
    expect(lines.map((line) => line.kind)).toEqual(["address", "phone", "email"]);
    expect(contactHref("phone", "050-0000000")).toBe("tel:0500000000");
    expect(contactHref("email", "a@b.co")).toBe("mailto:a@b.co");
  });
});

describe("nextDemoIndex", () => {
  it("revient à la première scène après la dernière", () => {
    expect(nextDemoIndex(3, 4)).toBe(0);
    expect(nextDemoIndex(0, 0)).toBe(0);
  });
});
