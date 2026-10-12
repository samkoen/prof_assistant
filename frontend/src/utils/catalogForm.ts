import { he } from "../i18n/he";

export interface CatalogEditForm {
  name: string;
  description: string;
}

type CatalogEditSource = { name: string; description: string | null };

export function catalogToEditForm(catalog: CatalogEditSource): CatalogEditForm {
  return { name: catalog.name, description: catalog.description ?? "" };
}

export function catalogEditMissing(form: CatalogEditForm): string | null {
  if (!form.name.trim()) return he.subject;
  return null;
}

export function buildCatalogUpdatePayload(form: CatalogEditForm) {
  return { name: form.name.trim(), description: form.description.trim() || null };
}
