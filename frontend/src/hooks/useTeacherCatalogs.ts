import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type CatalogCourse } from "../api/client";
import { he } from "../i18n/he";

export type CatalogForm = { name: string; description: string };

/** Cours du catalogue du professeur : liste et création. */
export function useTeacherCatalogs() {
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setCatalogs(await api<CatalogCourse[]>("/api/catalog-courses/mine"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (form: CatalogForm): Promise<boolean> => {
    try {
      const body = JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null });
      await api("/api/catalog-courses", { method: "POST", body });
      await load();
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
      return false;
    }
  };

  return { catalogs, loading, error, setError, create, reload: load };
}
