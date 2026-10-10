import { Link } from "react-router-dom";
import { Box, Button, ButtonBase, Skeleton, Typography } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import EmptyState from "../ui/EmptyState";
import SectionHeader from "../ui/SectionHeader";
import StatusChip from "../ui/StatusChip";
import { offeringLabel, type CourseOffering } from "../../api/client";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";

const MAX_ROWS = 4;

type StudentCoursesPanelProps = {
  offerings: CourseOffering[];
  activeCounts: Record<number, number>;
  loading: boolean;
};

const rowSx = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1.5,
  px: 2,
  py: 1.5,
  textAlign: "right",
  borderRadius: 2.5,
  border: `1px solid ${brand.slate200}`,
  transition: "border-color 0.15s ease, background-color 0.15s ease",
  "&:hover": { borderColor: brand.violet400, bgcolor: brand.violet50 },
} as const;

function CourseRow({ offering, active }: { offering: CourseOffering; active: number }) {
  return (
    <ButtonBase component={Link} to={`/student/courses/${offering.id}`} sx={rowSx}>
      <Typography fontWeight={700} noWrap sx={{ flex: 1, minWidth: 0 }}>
        {offeringLabel(offering)}
      </Typography>
      {active > 0 && <StatusChip label={he.studentCourseExamsBadge(active)} tone="success" />}
    </ButtonBase>
  );
}

function JoinCta() {
  return (
    <Button component={Link} to="/student/join-course" variant="contained" startIcon={<SchoolIcon />}>
      {he.joinByTeacherTitle}
    </Button>
  );
}

/** Aperçu des cours de l'élève, avec le nombre d'examens actifs ; sinon invitation à rejoindre un cours. */
export default function StudentCoursesPanel({ offerings, activeCounts, loading }: StudentCoursesPanelProps) {
  return (
    <Box>
      <SectionHeader title={he.studentMyCoursesTitle} linkLabel={he.recentExamsAll} linkTo="/student/courses" />
      {loading ? (
        <Skeleton variant="rounded" height={160} />
      ) : offerings.length === 0 ? (
        <EmptyState title={he.studentCoursesEmptyTitle} description={he.noCoursesJoinHint} icon={<SchoolIcon />} action={<JoinCta />} />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {offerings.slice(0, MAX_ROWS).map((o) => (
            <CourseRow key={o.id} offering={o} active={activeCounts[o.id] ?? 0} />
          ))}
        </Box>
      )}
    </Box>
  );
}
