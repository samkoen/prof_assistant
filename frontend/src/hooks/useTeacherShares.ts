import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, type TeacherShare } from "../api/client";
import { he } from "../i18n/he";
import { splitShares } from "../utils/teacherShares";

/** Partages entre professeurs : reçus en attente, envoyés, et refus d'un partage. */
export function useTeacherShares() {
  const [incoming, setIncoming] = useState<TeacherShare[]>([]);
  const [sent, setSent] = useState<TeacherShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decliningId, setDecliningId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [inc, out] = await Promise.all([
        api<TeacherShare[]>("/api/teacher-shares/incoming"),
        api<TeacherShare[]>("/api/teacher-shares/sent"),
      ]);
      setIncoming(inc);
      setSent(out);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decline = async (id: number) => {
    setDecliningId(id);
    try {
      await api(`/api/teacher-shares/${id}/decline`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setDecliningId(null);
    }
  };

  const { pendingIncoming, sentSorted } = useMemo(() => splitShares(incoming, sent), [incoming, sent]);
  return { pendingIncoming, sentSorted, loading, error, setError, decliningId, decline, reload: load };
}
