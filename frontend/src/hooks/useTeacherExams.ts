import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type CatalogCourse, type CourseOffering, type ExamSession } from "../api/client";
import { he } from "../i18n/he";

/** Sessions, cours catalogue et groupes du prof, avec rechargement. */
export function useTeacherExams() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // `loading` ne vaut true qu'au premier chargement : les rechargements gardent la liste affichée.
  const load = useCallback(async () => {
    setError("");
    try {
      const [sess, cats, offs] = await Promise.all([
        api<ExamSession[]>("/api/exams/sessions/mine"),
        api<CatalogCourse[]>("/api/catalog-courses/mine"),
        api<CourseOffering[]>("/api/courses/mine"),
      ]);
      setSessions(sess);
      setCatalogs(cats);
      setOfferings(offs);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sessions, catalogs, offerings, loading, error, setError, load };
}
