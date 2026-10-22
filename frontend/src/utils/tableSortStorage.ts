export type TableSort = { key: string; order: "asc" | "desc" };

function isSort(value: unknown, validKeys: string[]): value is TableSort {
  if (typeof value !== "object" || value === null) return false;
  const { key, order } = value as Partial<TableSort>;
  return typeof key === "string" && validKeys.includes(key) && (order === "asc" || order === "desc");
}

/** Tri mémorisé d'un tableau, ou `fallback` si absent, corrompu ou sur une colonne disparue. */
export function loadTableSort(storageKey: string, validKeys: string[], fallback: TableSort): TableSort {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isSort(parsed, validKeys) ? { key: parsed.key, order: parsed.order } : fallback;
  } catch {
    return fallback;
  }
}

export function saveTableSort(storageKey: string, sort: TableSort): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(sort));
  } catch {
    /* stockage indisponible : le tri reste valable pour la session */
  }
}
