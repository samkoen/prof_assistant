import StatusChip from "../components/ui/StatusChip";
import type { DataListColumnDef } from "../components/DataListTable/types";
import type { StudentAccount } from "../api/client";
import { he } from "../i18n/he";

export function getStudentTableColumns(): DataListColumnDef<StudentAccount>[] {
  return [
    {
      key: "full_name",
      label: he.fullName,
      minWidth: 140,
      getValue: (s) => s.full_name,
      renderCell: (s) => s.full_name,
    },
    {
      key: "email",
      label: he.email,
      minWidth: 180,
      cellDir: "ltr",
      getValue: (s) => s.email,
      renderCell: (s) => s.email,
    },
    {
      key: "student_id",
      label: he.studentId,
      minWidth: 110,
      getValue: (s) => s.student_id ?? "",
      renderCell: (s) => s.student_id ?? "—",
    },
    {
      key: "phone",
      label: he.phone,
      minWidth: 110,
      getValue: (s) => s.phone ?? "",
      renderCell: (s) => s.phone ?? "—",
    },
    {
      key: "status",
      label: he.status,
      minWidth: 100,
      getValue: (s) => (s.email_verified ? he.verified : he.pending),
      renderCell: (s) => (
        <StatusChip label={s.email_verified ? he.verified : he.pending} tone={s.email_verified ? "success" : "warning"} />
      ),
    },
  ];
}
