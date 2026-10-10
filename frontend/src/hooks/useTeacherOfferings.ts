import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type CourseOffering, type Enrollment } from "../api/client";
import { he } from "../i18n/he";
import { countPendingByOffering } from "../utils/offeringsList";

/** Groupes du prof + nombre de demandes en attente par groupe (best effort). */
export function useTeacherOfferings() {
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [pendingByOffering, setPendingByOffering] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const [offs, pending] = await Promise.allSettled([
      api<CourseOffering[]>("/api/courses/mine"),
      api<Enrollment[]>("/api/enrollments/pending"),
    ]);
    if (offs.status === "fulfilled") setOfferings(offs.value);
    else setError(offs.reason instanceof ApiError ? offs.reason.message : he.errorGeneric);
    if (pending.status === "fulfilled") setPendingByOffering(countPendingByOffering(pending.value));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { offerings, pendingByOffering, loading, error, setError, reload: load };
}
