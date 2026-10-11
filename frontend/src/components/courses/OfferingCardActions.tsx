import { Link as RouterLink } from "react-router-dom";
import { Button, IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupIcon from "@mui/icons-material/Group";
import PeopleIcon from "@mui/icons-material/People";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import QuizIcon from "@mui/icons-material/Quiz";
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

function OwnerCourseButtons({ offering, onEdit, onDelete }: Pick<HeaderActionsProps, "offering" | "onEdit" | "onDelete">) {
  return (
    <>
      <Tooltip title={he.editOffering}>
        <IconButton size="small" aria-label={he.editOffering} sx={{ color: "text.secondary" }} onClick={() => onEdit(offering)}>
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={he.deleteOffering}>
        <IconButton size="small" color="error" aria-label={he.deleteOffering} onClick={() => onDelete(offering)}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}

/** Icônes de l'en-tête : édition, suppression (propriétaire), enseignants et invitation. */
export function OfferingHeaderActions({ offering, userId, onManageTeachers, onInvite, onEdit, onDelete }: HeaderActionsProps) {
  const owner = isOfferingOwner(offering.teachers, userId);
  return (
    <>
      {owner && <OwnerCourseButtons offering={offering} onEdit={onEdit} onDelete={onDelete} />}
      <Tooltip title={he.manageOfferingTeachers}>
        <IconButton size="small" aria-label={he.manageOfferingTeachers} sx={{ color: "text.secondary" }} onClick={() => onManageTeachers(offering)}>
          <PeopleIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {isOfferingOwner(offering.teachers, userId) && (
        <Tooltip title={he.inviteOfferingTeacher}>
          <IconButton size="small" aria-label={he.inviteOfferingTeacher} sx={{ color: "secondary.main" }} onClick={() => onInvite(offering)}>
            <PersonAddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
}

/** Pied de carte : accès direct, avec libellés, aux étudiants et aux examens du groupe. */
export function OfferingFooterActions({ offering }: { offering: CourseOffering }) {
  return (
    <>
      <Button component={RouterLink} to={`/teacher/courses/${offering.id}/students`} size="small" startIcon={<GroupIcon />}>
        {he.coursesStudentsAction}
      </Button>
      <Button component={RouterLink} to={`/teacher/courses/${offering.id}/exams`} size="small" startIcon={<QuizIcon />}>
        {he.coursesExamsAction}
      </Button>
    </>
  );
}

/** Pastille cliquable « N בקשות ממתינות » quand le groupe a des demandes en attente. */
export function PendingBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <StatusChip label={he.coursesPendingBadge(count)} tone="warning" />;
}
