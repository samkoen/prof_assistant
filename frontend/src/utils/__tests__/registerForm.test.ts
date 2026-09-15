import { describe, expect, it } from "vitest";
import {
  applyRegisterRole,
  buildRegisterPayload,
  canChooseRegisterRole,
  showStudentIdField,
  type RegisterFormValues,
} from "../registerForm";

const baseForm = (): RegisterFormValues => ({
  email: "ada@school.test",
  password: "secret12",
  full_name: "Ada",
  phone: "",
  student_id: "S-1",
  role: "student",
});

describe("registerForm", () => {
  it("laisse choisir élève ou professeur hors lien d'inscription", () => {
    expect(canChooseRegisterRole(null)).toBe(true);
    expect(canChooseRegisterRole("join-token")).toBe(false);
  });

  it("envoie le rôle professeur sans numéro d'élève", () => {
    const payload = buildRegisterPayload({ ...baseForm(), role: "teacher" });
    expect(payload.role).toBe("teacher");
    expect(payload.student_id).toBeNull();
    expect(showStudentIdField("teacher")).toBe(false);
  });

  it("conserve le numéro d'élève pour une inscription élève", () => {
    const payload = buildRegisterPayload(baseForm());
    expect(payload.role).toBe("student");
    expect(payload.student_id).toBe("S-1");
    expect(showStudentIdField("student")).toBe(true);
  });

  it("efface le numéro d'élève au passage professeur", () => {
    const next = applyRegisterRole(baseForm(), "teacher");
    expect(next.role).toBe("teacher");
    expect(next.student_id).toBe("");
  });
});
