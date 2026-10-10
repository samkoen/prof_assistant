import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import type { StudentAccount } from "../api/client";
import { he } from "../i18n/he";

type StudentRowActionsProps = {
  student: StudentAccount;
  busy: boolean;
  allowVerify: boolean;
  onVerify: (student: StudentAccount) => void;
  onDelete: (student: StudentAccount) => void;
};

/** Actions d'une ligne étudiant : vérification e-mail (prof) et suppression. */
export default function StudentRowActions({ student, busy, allowVerify, onVerify, onDelete }: StudentRowActionsProps) {
  return (
    <>
      {allowVerify && !student.email_verified && (
        <Tooltip title={he.verifyStudentEmail}>
          <span>
            <IconButton size="small" color="success" disabled={busy} aria-label={he.verifyStudentEmail} onClick={() => onVerify(student)}>
              <MarkEmailReadIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Tooltip title={he.deleteStudent}>
        <span>
          <IconButton size="small" color="error" disabled={busy} aria-label={he.deleteStudent} onClick={() => onDelete(student)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}
