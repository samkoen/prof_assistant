import { describe, expect, it } from "vitest";
import {
  isOfferingCoTeacher,
  isOfferingOwner,
  offeringTeacherNames,
} from "../offeringTeachers";

describe("offeringTeachers", () => {
  it("joint les noms et retombe sur teacher_name", () => {
    expect(offeringTeacherNames({ teacher_name: "אלון" })).toBe("אלון");
    expect(
      offeringTeacherNames({
        teacher_name: "אלון",
        teachers: [
          { id: 1, name: "אלון", role: "owner" },
          { id: 2, name: "דנה", role: "co_teacher" },
        ],
      }),
    ).toBe("אלון · דנה");
  });

  it("détecte propriétaire et co-enseignant", () => {
    const teachers = [
      { id: 1, name: "אלון", role: "owner" as const },
      { id: 2, name: "דנה", role: "co_teacher" as const },
    ];
    expect(isOfferingOwner(teachers, 1)).toBe(true);
    expect(isOfferingOwner(teachers, 2)).toBe(false);
    expect(isOfferingCoTeacher(teachers, 2)).toBe(true);
    expect(isOfferingCoTeacher(teachers, 1)).toBe(false);
    expect(isOfferingOwner(undefined, 1)).toBe(false);
  });
});
