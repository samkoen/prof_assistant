import { he } from "../i18n/he";

export const NEW_CATALOG_ID = "__new__";

export interface OfferingForm {
  catalog_course_id: string;
  group_name: string;
  academic_year: string;
  semester: string;
  description: string;
  is_open_enrollment: boolean;
  auto_approve_enrollment: boolean;
}

export interface NewCatalogForm {
  name: string;
  description: string;
}

export const EMPTY_NEW_CATALOG: NewCatalogForm = { name: "", description: "" };

export function emptyOfferingForm(year = new Date().getFullYear()): OfferingForm {
  return {
    catalog_course_id: "",
    group_name: "",
    academic_year: String(year),
    semester: "1",
    description: "",
    is_open_enrollment: true,
    auto_approve_enrollment: false,
  };
}

export function isNewCatalog(form: OfferingForm): boolean {
  return form.catalog_course_id === NEW_CATALOG_ID;
}

/** Premier champ manquant (libellé à afficher), ou null si le formulaire est complet. */
export function offeringMissingField(form: OfferingForm, catalog: NewCatalogForm): string | null {
  if (!form.catalog_course_id) return he.selectCatalogCourse;
  if (isNewCatalog(form) && !catalog.name.trim()) return he.subject;
  if (!form.group_name.trim()) return he.groupName;
  return null;
}

export function buildOfferingPayload(form: OfferingForm, catalogCourseId: number) {
  return {
    catalog_course_id: catalogCourseId,
    group_name: form.group_name,
    academic_year: Number(form.academic_year),
    semester: Number(form.semester),
    description: form.description || null,
    is_open_enrollment: form.is_open_enrollment,
    auto_approve_enrollment: form.is_open_enrollment ? form.auto_approve_enrollment : false,
  };
}

export function buildCatalogPayload(catalog: NewCatalogForm) {
  return { name: catalog.name.trim(), description: catalog.description.trim() || null };
}

export interface OfferingEditForm {
  catalog_name: string;
  group_name: string;
  academic_year: string;
  semester: string;
  description: string;
}

type OfferingEditSource = {
  catalog_name: string;
  group_name: string;
  academic_year: number;
  semester: number;
  description: string | null;
};

export function offeringToEditForm(offering: OfferingEditSource): OfferingEditForm {
  return {
    catalog_name: offering.catalog_name,
    group_name: offering.group_name,
    academic_year: String(offering.academic_year),
    semester: String(offering.semester),
    description: offering.description ?? "",
  };
}

export function offeringEditMissing(form: OfferingEditForm): string | null {
  if (!form.catalog_name.trim()) return he.subject;
  if (!form.group_name.trim()) return he.groupName;
  return null;
}

export function buildOfferingUpdatePayload(form: OfferingEditForm) {
  return {
    catalog_name: form.catalog_name.trim(),
    group_name: form.group_name.trim(),
    academic_year: Number(form.academic_year),
    semester: Number(form.semester),
    description: form.description.trim() || null,
  };
}
