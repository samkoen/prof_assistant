import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import { buildOfferingUpdatePayload, offeringEditMissing, offeringToEditForm } from "../offeringForm";

const offering = {
  catalog_name: "מבני נתונים",
  group_name: "א",
  academic_year: 2026,
  semester: 2,
  description: null as string | null,
};

describe("édition d'une הרצה", () => {
  it("reprend les champs du cours", () => {
    expect(offeringToEditForm(offering)).toEqual({
      catalog_name: "מבני נתונים",
      group_name: "א",
      academic_year: "2026",
      semester: "2",
      description: "",
    });
  });

  it("signale un nom ou un groupe vide", () => {
    const form = offeringToEditForm(offering);
    expect(offeringEditMissing({ ...form, catalog_name: "  " })).toBe(he.subject);
    expect(offeringEditMissing({ ...form, group_name: "" })).toBe(he.groupName);
    expect(offeringEditMissing(form)).toBeNull();
  });

  it("envoie un payload nettoyé", () => {
    const form = { ...offeringToEditForm(offering), description: "  הערה  " };
    expect(buildOfferingUpdatePayload(form)).toEqual({
      catalog_name: "מבני נתונים",
      group_name: "א",
      academic_year: 2026,
      semester: 2,
      description: "הערה",
    });
  });
});
