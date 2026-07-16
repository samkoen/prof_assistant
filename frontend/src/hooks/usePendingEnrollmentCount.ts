import { useCallback, useEffect, useState } from "react";
import { api, type Enrollment } from "../api/client";
import { useAuth } from "../context/AuthContext";

/** Compteur des demandes d'inscription en attente (enseignants). */
export function usePendingEnrollmentCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (user?.role !== "teacher") {
      setCount(0);
      return;
    }
    try {
      const rows = await api<Enrollment[]>("/api/enrollments/pending");
      setCount(rows.length);
    } catch {
      /* silencieux — le badge n'est pas critique */
    }
  }, [user?.role]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  return count;
}
