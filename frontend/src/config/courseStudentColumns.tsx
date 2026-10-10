import StatusChip from "../components/ui/StatusChip";
import type { DataListColumnDef } from "../components/DataListTable/types";
import type { Enrollment } from "../api/client";
import { he } from "../i18n/he";
import { enrollmentStatusView } from "../utils/enrollmentStatus";

/** Colonnes du tableau des étudiants d'un groupe (nom, e-mail LTR, statut coloré). */
export function getCourseStudentColumns(): DataListColumnDef<Enrollment>[] {
  return [
    { key: "student_name", label: he.fullName, minWidth: 140, getValue: (e) => e.student_name, renderCell: (e) => e.student_name },
    {
      key: "student_email",
      label: he.email,
      minWidth: 180,
      cellDir: "ltr",
      getValue: (e) => e.student_email,
      renderCell: (e) => e.student_email,
    },
    {
      key: "status",
      label: he.status,
      minWidth: 110,
      getValue: (e) => enrollmentStatusView(e.status).label,
      renderCell: (e) => {
        const view = enrollmentStatusView(e.status);
        return <StatusChip label={view.label} tone={view.tone} />;
      },
    },
  ];
}
