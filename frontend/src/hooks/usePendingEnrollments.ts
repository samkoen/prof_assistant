import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Enrollment } from "../api/client";
import { he } from "../i18n/he";

/** Demandes d'inscription en attente, avec retrait local après traitement. */
export function usePendingEnrollments() {
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setRows(await api<Enrollment[]>("/api/enrollments/pending"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = useCallback((ids: number[]) => {
    setRows((prev) => prev.filter((row) => !ids.includes(row.id)));
  }, []);

  return { rows, loading, error, setError, reload: load, remove };
}
