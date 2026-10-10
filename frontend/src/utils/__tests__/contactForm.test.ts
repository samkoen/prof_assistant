import { describe, expect, it } from "vitest";
import {
  canSubmitContact,
  canSubmitPublicContact,
  contactCategoryLabel,
  EMPTY_CONTACT_FORM,
  EMPTY_PUBLIC_CONTACT_FORM,
  validateContactForm,
  validatePublicContactForm,
} from "../contactForm";

const valid = { ...EMPTY_CONTACT_FORM, subject: "שאלה על קרדיטים", message: "איך אפשר לרכוש חבילה נוספת?" };

describe("validateContactForm", () => {
  it("accepts a complete form", () => {
    expect(validateContactForm(valid)).toBeNull();
    expect(canSubmitContact(valid)).toBe(true);
  });

  it("rejects an empty or too short subject", () => {
    expect(validateContactForm(EMPTY_CONTACT_FORM)).not.toBeNull();
    expect(canSubmitContact({ ...valid, subject: "  א  " })).toBe(false);
  });

  it("rejects a too short message, ignoring surrounding spaces", () => {
    expect(canSubmitContact({ ...valid, message: "   קצר   " })).toBe(false);
  });
});

describe("validatePublicContactForm", () => {
  const visitor = { ...EMPTY_PUBLIC_CONTACT_FORM, ...valid, name: "יוסי לוי", email: "yossi@example.com" };

  it("accepts a visitor with name, valid email and message", () => {
    expect(canSubmitPublicContact(visitor)).toBe(true);
  });

  it("requires a name and a valid email", () => {
    expect(validatePublicContactForm({ ...visitor, name: " " })).not.toBeNull();
    expect(validatePublicContactForm({ ...visitor, email: "pas-un-email" })).not.toBeNull();
  });

  it("still validates subject and message", () => {
    expect(canSubmitPublicContact({ ...visitor, message: "קצר" })).toBe(false);
  });
});

describe("contactCategoryLabel", () => {
  it("returns a Hebrew label for every category", () => {
    expect(contactCategoryLabel("bug")).toBe("דיווח על תקלה");
    expect(contactCategoryLabel("question")).toBeTruthy();
  });
});
