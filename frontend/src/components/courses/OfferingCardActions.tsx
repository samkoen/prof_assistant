import { Link as RouterLink } from "react-router-dom";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
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

const iconRowSx = { display: "flex", gap: 0.25, justifyContent: "center" };

function OwnerCourseButtons({ offering, onEdit, onDelete }: Pick<HeaderActionsProps, "offering" | "onEdit" | "onDelete">) {
  return (
    <Box sx={iconRowSx}>
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
    </Box>
  );
}

function StaffCourseButtons({ offering, owner, onManageTeachers, onInvite }: Pick<HeaderActionsProps, "offering" | "onManageTeachers" | "onInvite"> & { owner: boolean }) {
  return (
    <Box sx={iconRowSx}>
      <Tooltip title={he.manageOfferingTeachers}>
        <IconButton size="small" aria-label={he.manageOfferingTeachers} sx={{ color: "text.secondary" }} onClick={() => onManageTeachers(offering)}>
          <PeopleIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {owner && (
        <Tooltip title={he.inviteOfferingTeacher}>
          <IconButton size="small" aria-label={he.inviteOfferingTeacher} sx={{ color: "secondary.main" }} onClick={() => onInvite(offering)}>
            <PersonAddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

/** En-tête : enseignants et invitation, puis édition et suppression dessous (propriétaire). */
export function OfferingHeaderActions({ offering, userId, onManageTeachers, onInvite, onEdit, onDelete }: HeaderActionsProps) {
  const owner = isOfferingOwner(offering.teachers, userId);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <StaffCourseButtons offering={offering} owner={owner} onManageTeachers={onManageTeachers} onInvite={onInvite} />
      {owner && <OwnerCourseButtons offering={offering} onEdit={onEdit} onDelete={onDelete} />}
    </Box>
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
