import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, type CourseOffering, type Enrollment, type StudentAccount } from "../api/client";
import { useFeedback } from "../context/FeedbackContext";
import { he } from "../i18n/he";
import { addableStudents } from "../utils/enrollmentStatus";

function messageOf(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

/** Étudiants d'un groupe : inscriptions, ajout manuel et retrait. */
export function useCourseStudents(offeringId: number) {
  const { showSuccess } = useFeedback();
  const [course, setCourse] = useState<CourseOffering | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allStudents, setAllStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!offeringId || Number.isNaN(offeringId)) return;
    setError("");
    try {
      const [courses, enr, students] = await Promise.all([
        api<CourseOffering[]>("/api/courses/mine"),
        api<Enrollment[]>(`/api/courses/${offeringId}/enrollments`),
        api<StudentAccount[]>("/api/students"),
      ]);
      setCourse(courses.find((c) => c.id === offeringId) ?? null);
      setEnrollments(enr);
      setAllStudents(students);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, [offeringId]);

  useEffect(() => {
    load();
  }, [load]);

  const addStudent = async (studentId: number): Promise<boolean> => {
    try {
      const body = JSON.stringify({ student_id: studentId });
      await api(`/api/courses/${offeringId}/enrollments`, { method: "POST", body });
      showSuccess(he.courseStudentsAddedSuccess);
      await load();
      return true;
    } catch (e) {
      setError(messageOf(e));
      return false;
    }
  };

  const removeEnrollment = async (enrollmentId: number): Promise<boolean> => {
    try {
      await api(`/api/enrollments/${enrollmentId}`, { method: "DELETE" });
      showSuccess(he.courseStudentsRemovedSuccess);
      await load();
      return true;
    } catch (e) {
      setError(messageOf(e));
      return false;
    }
  };

  const candidates = useMemo(() => addableStudents(allStudents, enrollments), [allStudents, enrollments]);

  return { course, setCourse, enrollments, candidates, loading, error, setError, reload: load, addStudent, removeEnrollment };
}
