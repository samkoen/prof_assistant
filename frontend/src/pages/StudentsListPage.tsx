import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import ListPageToolbar from "../components/ListPageToolbar";
import DataListTable from "../components/DataListTable/DataListTable";
import StudentFormDialog, { type StudentFormValues } from "../components/StudentFormDialog";
import { getStudentTableColumns } from "../config/studentTableColumns";
import { api, ApiError, verifyStudentEmailBypass, type StudentAccount } from "../api/client";
import { he } from "../i18n/he";

const emptyForm = (): StudentFormValues => ({
  email: "",
  password: "",
  full_name: "",
  phone: "",
  student_id: "",
});

interface StudentsListPageProps {
  /** Clé localStorage pour colonnes/largeurs du tableau */
  tableViewKey: string;
  /** Bouton « אימות תלמיד » pour les comptes en attente (prof uniquement) */
  allowEmailVerifyBypass?: boolean;
}

export default function StudentsListPage({
  tableViewKey,
  allowEmailVerifyBypass = false,
}: StudentsListPageProps) {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const columns = useMemo(() => getStudentTableColumns(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStudents(await api<StudentAccount[]>("/api/students"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createStudent = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await api("/api/students", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          phone: form.phone || null,
          student_id: form.student_id || null,
        }),
      });
      setOpen(false);
      setForm(emptyForm());
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyEmail = async (student: StudentAccount) => {
    setVerifyingId(student.id);
    setError("");
    setSuccess("");
    try {
      await verifyStudentEmailBypass(student.id);
      setSuccess(he.verifyStudentEmailSuccess);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <ListPageToolbar
        title={he.students}
        subtitle={he.studentsSubtitle}
        addLabel={he.newStudent}
        onAdd={() => setOpen(true)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {loading && students.length === 0 ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <DataListTable
          viewKey={tableViewKey}
          rows={students}
          columns={columns}
          loading={loading}
          emptyMessage={he.noStudents}
          getRowId={(s) => s.id}
          renderActions={
            allowEmailVerifyBypass
              ? (s) =>
                  !s.email_verified ? (
                    <Tooltip title={he.verifyStudentEmail}>
                      <span>
                        <IconButton
                          size="small"
                          color="success"
                          disabled={verifyingId === s.id}
                          onClick={() => verifyEmail(s)}
                        >
                          <MarkEmailReadIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null
              : undefined
          }
        />
      )}

      <StudentFormDialog
        open={open}
        onClose={() => setOpen(false)}
        form={form}
        onChange={setForm}
        onSubmit={createStudent}
        submitting={submitting}
      />
    </Box>
  );
}
