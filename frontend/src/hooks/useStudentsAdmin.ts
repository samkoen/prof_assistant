import { useCallback, useEffect, useState } from "react";
import { api, ApiError, deleteStudent, verifyStudentEmailBypass, type StudentAccount } from "../api/client";
import { he } from "../i18n/he";
import type { StudentFormValues } from "../components/StudentFormDialog";

export const emptyStudentForm = (): StudentFormValues => ({
  email: "",
  password: "",
  full_name: "",
  phone: "",
  student_id: "",
});

function messageOf(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

/** Liste des étudiants et actions (création, vérification e-mail, suppression). */
export function useStudentsAdmin() {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setStudents(await api<StudentAccount[]>("/api/students"));
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Exécute une action puis recharge ; retourne true en cas de succès. */
  const run = async (action: () => Promise<unknown>, okMessage?: string, id?: number): Promise<boolean> => {
    setError("");
    setSuccess("");
    setBusyId(id ?? null);
    try {
      await action();
      if (okMessage) setSuccess(okMessage);
      await load();
      return true;
    } catch (e) {
      setError(messageOf(e));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const create = (form: StudentFormValues) => {
    const body = JSON.stringify({ ...form, phone: form.phone || null, student_id: form.student_id || null });
    return run(() => api("/api/students", { method: "POST", body }));
  };
  const verify = (s: StudentAccount) => run(() => verifyStudentEmailBypass(s.id), he.verifyStudentEmailSuccess, s.id);
  const remove = (s: StudentAccount) => run(() => deleteStudent(s.id), he.studentDeleted, s.id);

  return { students, loading, error, success, busyId, setError, setSuccess, create, verify, remove };
}
