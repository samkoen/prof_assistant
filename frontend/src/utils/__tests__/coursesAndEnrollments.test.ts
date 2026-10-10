import { describe, expect, it } from "vitest";
import type { CourseOffering, Enrollment } from "../../api/client";
import { he } from "../../i18n/he";
import { groupEnrollments } from "../enrollmentGroups";
import {
  NEW_CATALOG_ID,
  buildOfferingPayload,
  emptyOfferingForm,
  offeringMissingField,
} from "../offeringForm";
import { countPendingByOffering, filterOfferings, sortOfferings } from "../offeringsList";

function offering(patch: Partial<CourseOffering>): CourseOffering {
  return {
    id: 1,
    catalog_course_id: 1,
    catalog_name: "מתמטיקה",
    group_name: "א",
    academic_year: 2026,
    semester: 1,
    description: null,
    is_open_enrollment: true,
    auto_approve_enrollment: false,
    teacher_name: "דנה",
    created_at: "2026-01-01T00:00:00Z",
    ...patch,
  };
}

function enrollment(patch: Partial<Enrollment>): Enrollment {
  return {
    id: 1,
    offering_id: 1,
    student_id: 1,
    student_name: "יוסי כהן",
    student_email: "yossi@example.com",
    status: "pending",
    created_at: "2026-01-01T00:00:00Z",
    catalog_name: "מתמטיקה",
    group_name: "א",
    academic_year: 2026,
    semester: 1,
    ...patch,
  };
}

describe("filterOfferings / sortOfferings", () => {
  const rows = [
    offering({ id: 1 }),
    offering({ id: 2, catalog_name: "פיזיקה", semester: 2, academic_year: 2025 }),
    offering({ id: 3, catalog_name: "כימיה", semester: 2, academic_year: 2026, description: "מעבדה" }),
  ];

  it("filtre par texte, dont la description", () => {
    expect(filterOfferings(rows, "מעבדה", "all").map((o) => o.id)).toEqual([3]);
  });

  it("filtre par semestre et combine avec le texte", () => {
    expect(filterOfferings(rows, "", "2").map((o) => o.id)).toEqual([2, 3]);
    expect(filterOfferings(rows, "פיזיקה", "1")).toEqual([]);
  });

  it("trie du plus récent au plus ancien, puis par nom", () => {
    expect(sortOfferings(rows).map((o) => o.id)).toEqual([3, 1, 2]);
  });
});

describe("countPendingByOffering", () => {
  it("compte les demandes par groupe", () => {
    const counts = countPendingByOffering([{ offering_id: 4 }, { offering_id: 4 }, { offering_id: 9 }]);
    expect(counts).toEqual({ 4: 2, 9: 1 });
  });
});

describe("groupEnrollments", () => {
  const rows = [
    enrollment({ id: 1, offering_id: 1 }),
    enrollment({ id: 2, offering_id: 1, student_name: "דנה לוי", student_email: "dana@example.com" }),
    enrollment({ id: 3, offering_id: 2, catalog_name: "פיזיקה", group_name: "ב" }),
    enrollment({ id: 4, offering_id: 3, catalog_name: null }),
  ];

  it("regroupe par groupe et libellé « sans cours » quand l'info manque", () => {
    const groups = groupEnrollments(rows, "");
    expect(groups.map((g) => g.rows.length).sort()).toEqual([1, 1, 2]);
    expect(groups.some((g) => g.label === he.enrollmentNoCourse)).toBe(true);
  });

  it("filtre par nom, e-mail ou cours", () => {
    expect(groupEnrollments(rows, "dana")[0].rows.map((r) => r.id)).toEqual([2]);
    expect(groupEnrollments(rows, "פיזיקה")[0].rows.map((r) => r.id)).toEqual([3]);
    expect(groupEnrollments(rows, "inconnu")).toEqual([]);
  });
});

describe("offeringForm", () => {
  it("signale le premier champ manquant", () => {
    const form = emptyOfferingForm(2026);
    expect(offeringMissingField(form, { name: "", description: "" })).toBe(he.selectCatalogCourse);
    expect(offeringMissingField({ ...form, catalog_course_id: NEW_CATALOG_ID }, { name: " ", description: "" })).toBe(he.subject);
    expect(offeringMissingField({ ...form, catalog_course_id: "3" }, { name: "", description: "" })).toBe(he.groupName);
    expect(offeringMissingField({ ...form, catalog_course_id: "3", group_name: "א" }, { name: "", description: "" })).toBeNull();
  });

  it("construit la charge utile et n'active pas l'approbation auto sans inscription ouverte", () => {
    const form = { ...emptyOfferingForm(2026), group_name: "א", is_open_enrollment: false, auto_approve_enrollment: true };
    expect(buildOfferingPayload(form, 5)).toMatchObject({
      catalog_course_id: 5,
      academic_year: 2026,
      semester: 1,
      description: null,
      is_open_enrollment: false,
      auto_approve_enrollment: false,
    });
  });
});
