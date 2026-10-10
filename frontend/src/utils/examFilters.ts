import type { ExamSession } from "../api/client";

export interface ExamFilters {
  query: string;
  /** Nom du cours catalogue ; chaîne vide = tous. */
  catalogName: string;
}

export const NO_FILTERS: ExamFilters = { query: "", catalogName: "" };

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase();
}

/** Tous les mots saisis doivent apparaître quelque part dans les champs. */
export function matchesQuery(fields: Array<string | number | null | undefined>, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalize(fields.filter((f) => f != null).join(" "));
  return words.every((word) => haystack.includes(word));
}

function matchesCatalog(catalogName: string, filters: ExamFilters): boolean {
  return !filters.catalogName || filters.catalogName === catalogName;
}

export function filterSessions(sessions: ExamSession[], filters: ExamFilters): ExamSession[] {
  return sessions.filter(
    (s) =>
      matchesCatalog(s.catalog_name, filters) &&
      matchesQuery([s.exam_title, s.catalog_name, s.group_name, s.academic_year], filters.query),
  );
}

export interface ExamTemplateRow {
  title: string;
  catalogName: string;
}

export function filterTemplates<T extends ExamTemplateRow>(rows: T[], filters: ExamFilters): T[] {
  return rows.filter(
    (row) => matchesCatalog(row.catalogName, filters) && matchesQuery([row.title, row.catalogName], filters.query),
  );
}

export function hasActiveFilters(filters: ExamFilters): boolean {
  return filters.query.trim() !== "" || filters.catalogName !== "";
}

/** Noms de cours uniques, triés, pour le sélecteur de filtre. */
export function catalogNames(names: string[]): string[] {
  return [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b, "he"));
}
