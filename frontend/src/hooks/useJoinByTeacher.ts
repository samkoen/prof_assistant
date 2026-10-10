import { useCallback, useState } from "react";
import { api, ApiError, type CourseOffering, type TeacherOpenOfferings } from "../api/client";
import { he } from "../i18n/he";

type EnrollmentResponse = { status: string };

function messageOf(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

/** Recherche des cours ouverts d'un prof (par e-mail) et demande d'inscription. */
export function useJoinByTeacher() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TeacherOpenOfferings | null>(null);
  const [searching, setSearching] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchOffers = useCallback(async (reset: boolean) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setSearching(true);
    setError("");
    if (reset) {
      setMessage("");
      setResult(null);
    }
    try {
      setResult(await api<TeacherOpenOfferings>(`/api/courses/by-teacher-email?email=${encodeURIComponent(trimmed)}`));
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSearching(false);
    }
  }, [email]);

  const join = async (offering: CourseOffering) => {
    setJoiningId(offering.id);
    setMessage("");
    setError("");
    try {
      const body = JSON.stringify({ offering_id: offering.id });
      const res = await api<EnrollmentResponse>("/api/enrollments/request", { method: "POST", body });
      setMessage(res.status === "approved" ? he.enrollmentApproved : he.enrollmentRequestSent);
      await fetchOffers(false);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setJoiningId(null);
    }
  };

  const reset = () => {
    setResult(null);
    setError("");
    setMessage("");
  };

  return { email, setEmail, result, searching, joiningId, message, error, setMessage, setError, search: () => fetchOffers(true), join, reset };
}
