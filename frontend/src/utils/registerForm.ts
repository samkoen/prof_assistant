import type { UserRole } from "../api/client";

export type SelfRegisterRole = Extract<UserRole, "student" | "teacher">;

export type RegisterFormValues = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  student_id: string;
  role: SelfRegisterRole;
};

export function canChooseRegisterRole(joinToken: string | null): boolean {
  return !joinToken;
}

export function showStudentIdField(role: SelfRegisterRole): boolean {
  return role === "student";
}

export function applyRegisterRole(
  form: RegisterFormValues,
  role: SelfRegisterRole,
): RegisterFormValues {
  return {
    ...form,
    role,
    student_id: role === "teacher" ? "" : form.student_id,
  };
}

export function buildRegisterPayload(form: RegisterFormValues) {
  return {
    email: form.email,
    password: form.password,
    full_name: form.full_name,
    phone: form.phone || null,
    student_id: showStudentIdField(form.role) ? form.student_id || null : null,
    role: form.role,
  };
}
