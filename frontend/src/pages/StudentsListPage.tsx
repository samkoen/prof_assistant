import { useMemo, useState } from "react";
import { Alert, Box, Skeleton } from "@mui/material";
import ListPageToolbar from "../components/ListPageToolbar";
import DataListTable from "../components/DataListTable/DataListTable";
import StudentFormDialog from "../components/StudentFormDialog";
import StudentRowActions from "../components/StudentRowActions";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ListSearchField from "../components/ui/ListSearchField";
import { getStudentTableColumns } from "../config/studentTableColumns";
import type { StudentAccount } from "../api/client";
import { emptyStudentForm, useStudentsAdmin } from "../hooks/useStudentsAdmin";
import { he } from "../i18n/he";
import { matchesQuery } from "../utils/examFilters";

interface StudentsListPageProps {
  /** Clé localStorage pour colonnes/largeurs du tableau */
  tableViewKey: string;
  /** Bouton « אימות תלמיד » pour les comptes en attente (prof uniquement) */
  allowEmailVerifyBypass?: boolean;
}

/** Liste des étudiants : recherche, création, vérification e-mail et suppression confirmée. */
export default function StudentsListPage({ tableViewKey, allowEmailVerifyBypass = false }: StudentsListPageProps) {
  const data = useStudentsAdmin();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyStudentForm);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<StudentAccount | null>(null);
  const columns = useMemo(() => getStudentTableColumns(), []);
  const rows = useMemo(
    () => data.students.filter((s) => matchesQuery([s.full_name, s.email, s.student_id ?? ""], query)),
    [data.students, query],
  );

  const submitCreate = async () => {
    if (!(await data.create(form))) return;
    setOpen(false);
    setForm(emptyStudentForm());
  };
  const confirmDelete = async () => {
    if (toDelete) await data.remove(toDelete);
    setToDelete(null);
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }} dir="rtl">
      <ListPageToolbar title={he.students} subtitle={he.studentsSubtitle} titleVariant="h5" addLabel={he.newStudent} onAdd={() => setOpen(true)} />
      {data.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => data.setError("")}>{data.error}</Alert>}
      {data.success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => data.setSuccess("")}>{data.success}</Alert>}
      {data.loading ? (
        <Skeleton variant="rounded" height={240} />
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <ListSearchField value={query} placeholder={he.studentsSearch} onChange={setQuery} />
          </Box>
          <DataListTable
            viewKey={tableViewKey}
            rows={rows}
            columns={columns}
            loading={false}
            emptyMessage={he.noStudents}
            getRowId={(s) => s.id}
            renderActions={(s) => (
              <StudentRowActions student={s} busy={data.busyId === s.id} allowVerify={allowEmailVerifyBypass} onVerify={data.verify} onDelete={setToDelete} />
            )}
          />
        </>
      )}
      <StudentFormDialog open={open} onClose={() => setOpen(false)} form={form} onChange={setForm} onSubmit={submitCreate} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={he.confirmDeleteStudentTitle}
        message={he.deleteStudentConfirm}
        detail={toDelete ? `${toDelete.full_name} (${toDelete.email})` : undefined}
        confirmLabel={he.deleteStudent}
        color="error"
        busy={data.busyId !== null && data.busyId === toDelete?.id}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
