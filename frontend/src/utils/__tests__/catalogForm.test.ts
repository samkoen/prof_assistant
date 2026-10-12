import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import { buildCatalogUpdatePayload, catalogEditMissing, catalogToEditForm } from "../catalogForm";

describe("édition d'un cours catalogue", () => {
  it("reprend le nom et une description vide", () => {
    expect(catalogToEditForm({ name: "מבנים", description: null })).toEqual({
      name: "מבנים",
      description: "",
    });
  });

  it("signale un nom vide", () => {
    expect(catalogEditMissing({ name: "  ", description: "" })).toBe(he.subject);
    expect(catalogEditMissing({ name: "מבנים", description: "" })).toBeNull();
  });

  it("envoie un payload nettoyé", () => {
    expect(buildCatalogUpdatePayload({ name: "  מבנים ", description: "  " })).toEqual({
      name: "מבנים",
      description: null,
    });
  });
});
