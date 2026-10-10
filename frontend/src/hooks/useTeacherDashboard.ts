import { useCallback, useEffect, useState } from "react";
import { api, type CatalogCourse, type CourseOffering, type Enrollment, type ExamSession } from "../api/client";

export interface TeacherDashboardData {
  sessions: ExamSession[];
  offerings: number;
  catalogs: number;
  pending: Enrollment[];
}

const EMPTY: TeacherDashboardData = { sessions: [], offerings: 0, catalogs: 0, pending: [] };

function valueOf<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

async function fetchDashboard(): Promise<{ data: TeacherDashboardData; failed: number }> {
  const results = await Promise.allSettled([
    api<ExamSession[]>("/api/exams/sessions/mine"),
    api<CourseOffering[]>("/api/courses/mine"),
    api<CatalogCourse[]>("/api/catalog-courses/mine"),
    api<Enrollment[]>("/api/enrollments/pending"),
  ]);
  const [sessions, offerings, catalogs, pending] = results;
  return {
    failed: results.filter((r) => r.status === "rejected").length,
    data: {
      sessions: valueOf(sessions, []),
      offerings: valueOf(offerings, []).length,
      catalogs: valueOf(catalogs, []).length,
      pending: valueOf(pending, []),
    },
  };
}

/** Données du tableau de bord prof ; une source en échec n'empêche pas les autres. */
export function useTeacherDashboard() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const next = await fetchDashboard();
    setData(next.data);
    setFailed(next.failed);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removePending = useCallback((id: number) => {
    setData((prev) => ({ ...prev, pending: prev.pending.filter((row) => row.id !== id) }));
  }, []);

  return { data, loading, failed, reload: load, removePending };
}
