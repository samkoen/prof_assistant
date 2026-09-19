export type OfferingTeacherRole = "owner" | "co_teacher";

export interface OfferingTeacherRef {
  id: number;
  name: string;
  role: OfferingTeacherRole;
}

export function offeringTeacherNames(offering: {
  teacher_name: string;
  teachers?: OfferingTeacherRef[];
}): string {
  const names = (offering.teachers ?? []).map((t) => t.name.trim()).filter(Boolean);
  if (names.length > 0) return names.join(" · ");
  return offering.teacher_name;
}

export function isOfferingOwner(
  teachers: OfferingTeacherRef[] | undefined,
  userId: number | undefined,
): boolean {
  if (userId == null) return false;
  return (teachers ?? []).some((t) => t.id === userId && t.role === "owner");
}

export function isOfferingCoTeacher(
  teachers: OfferingTeacherRef[] | undefined,
  userId: number | undefined,
): boolean {
  if (userId == null) return false;
  return (teachers ?? []).some((t) => t.id === userId && t.role === "co_teacher");
}
