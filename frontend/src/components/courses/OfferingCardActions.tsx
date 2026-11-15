import { Link as RouterLink } from "react-router-dom";
import { Button } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import PeopleIcon from "@mui/icons-material/PeopleOutline";
import PersonAddIcon from "@mui/icons-material/PersonAddAltOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ActionsMenu, { type MenuAction } from "../ui/ActionsMenu";
import StatusChip from "../ui/StatusChip";
import type { CourseOffering } from "../../api/client";
import { he } from "../../i18n/he";
import { isOfferingOwner } from "../../utils/offeringTeachers";

type HeaderActionsProps = {
  offering: CourseOffering;
  userId: number | undefined;
  onManageTeachers: (offering: CourseOffering) => void;
  onInvite: (offering: CourseOffering) => void;
  onEdit: (offering: CourseOffering) => void;
  onDelete: (offering: CourseOffering) => void;
};

/** Menu « ⋮ » de la carte : enseignants, invitation, édition, suppression (propriétaire). */
export function OfferingHeaderActions({ offering, userId, onManageTeachers, onInvite, onEdit, onDelete }: HeaderActionsProps) {
  const owner = isOfferingOwner(offering.teachers, userId);
  const actions: MenuAction[] = [
    { key: "teachers", label: he.manageOfferingTeachers, icon: <PeopleIcon fontSize="small" />, onClick: () => onManageTeachers(offering) },
  ];
  if (owner) {
    actions.push(
      { key: "invite", label: he.inviteOfferingTeacher, icon: <PersonAddIcon fontSize="small" />, onClick: () => onInvite(offering) },
      { key: "edit", label: he.editOffering, icon: <EditOutlinedIcon fontSize="small" />, onClick: () => onEdit(offering) },
      { key: "delete", label: he.deleteOffering, icon: <DeleteOutlineIcon fontSize="small" />, danger: true, onClick: () => onDelete(offering) },
    );
  }
  return <ActionsMenu actions={actions} label={he.actions} />;
}

const footerButtonSx = { flex: 1 } as const;

/** Pied de carte : accès direct, avec libellés, aux étudiants et aux examens du groupe. */
export function OfferingFooterActions({ offering }: { offering: CourseOffering }) {
  return (
    <>
      <Button component={RouterLink} to={`/teacher/courses/${offering.id}/exams`} variant="outlined" startIcon={<AssignmentOutlinedIcon />} sx={footerButtonSx}>
        {he.coursesExamsAction}
      </Button>
      <Button component={RouterLink} to={`/teacher/courses/${offering.id}/students`} variant="outlined" startIcon={<GroupIcon />} sx={footerButtonSx}>
        {he.coursesStudentsAction}
      </Button>
    </>
  );
}

/** Pastille cliquable « N בקשות ממתינות » quand le groupe a des demandes en attente. */
export function PendingBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <StatusChip label={he.coursesPendingBadge(count)} tone="warning" />;
}
