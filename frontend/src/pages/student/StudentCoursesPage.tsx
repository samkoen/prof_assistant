import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Skeleton } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import { OfferingCardGrid } from "../../components/CourseCardGrid/CourseCardGrid";
import ListPageToolbar from "../../components/ListPageToolbar";
import { ActiveExamsBadge, CourseExamsFooter } from "../../components/student/StudentCourseCardParts";
import EmptyState from "../../components/ui/EmptyState";
import SectionHeader from "../../components/ui/SectionHeader";
import { useStudentCourses } from "../../hooks/useStudentCourses";
import { he } from "../../i18n/he";

function JoinButton({ variant }: { variant: "contained" | "outlined" }) {
  return (
    <Button component={RouterLink} to="/student/join-course" variant={variant} startIcon={<SchoolIcon />}>
      {he.joinByTeacherTitle}
    </Button>
  );
}

/** Cours de l'élève : demandes en attente, cours approuvés avec examens actifs, accès à l'inscription. */
export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const data = useStudentCourses();
  const isEmpty = data.offerings.length === 0 && data.pending_offerings.length === 0;

  return (
    <Box sx={{ width: "100%" }} dir="rtl">
      <ListPageToolbar title={he.myCourses} titleVariant="h5" subtitle={he.doubleClickCourseHint} actions={<JoinButton variant="contained" />} />
      {data.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => data.setError("")}>{data.error}</Alert>}
      {data.loading ? (
        <Skeleton variant="rounded" height={220} />
      ) : isEmpty ? (
        <EmptyState title={he.studentCoursesEmptyTitle} description={he.noCoursesJoinHint} icon={<SchoolIcon />} action={<JoinButton variant="contained" />} />
      ) : (
        <>
          {data.pending_offerings.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <SectionHeader title={he.enrollmentPendingApproval} />
              <OfferingCardGrid offerings={data.pending_offerings} />
            </Box>
          )}
          {data.offerings.length > 0 && (
            <OfferingCardGrid
              offerings={data.offerings}
              onCardDoubleClick={(o) => navigate(`/student/courses/${o.id}`)}
              renderBadge={(o) => <ActiveExamsBadge offering={o} counts={data.active_exam_counts} />}
              renderFooter={(o) => <CourseExamsFooter offering={o} />}
            />
          )}
        </>
      )}
    </Box>
  );
}
