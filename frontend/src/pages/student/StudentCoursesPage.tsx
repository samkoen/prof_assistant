import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Skeleton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SchoolIcon from "@mui/icons-material/School";
import { OfferingCardGrid } from "../../components/CourseCardGrid/CourseCardGrid";
import ListPageToolbar from "../../components/ListPageToolbar";
import CreatePersonalSubjectDialog from "../../components/student/CreatePersonalSubjectDialog";
import { ActiveExamsBadge, CourseExamsFooter } from "../../components/student/StudentCourseCardParts";
import EmptyState from "../../components/ui/EmptyState";
import SectionHeader from "../../components/ui/SectionHeader";
import type { CourseOffering } from "../../api/client";
import { useStudentCourses } from "../../hooks/useStudentCourses";
import { he } from "../../i18n/he";

function JoinButton({ variant }: { variant: "contained" | "outlined" }) {
  return (
    <Button component={RouterLink} to="/student/join-course" variant={variant} startIcon={<SchoolIcon />}>
      {he.joinByTeacherTitle}
    </Button>
  );
}

function PersonalSection({
  offerings,
  counts,
  onOpen,
}: {
  offerings: CourseOffering[];
  counts: Record<number, number>;
  onOpen: (offering: CourseOffering) => void;
}) {
  if (offerings.length === 0) {
    return <EmptyState title={he.personalSubjectsEmpty} icon={<SchoolIcon />} />;
  }
  return (
    <OfferingCardGrid
      offerings={offerings}
      onCardDoubleClick={onOpen}
      renderBadge={(o) => <ActiveExamsBadge offering={o} counts={counts} />}
      renderFooter={(o) => <CourseExamsFooter offering={o} />}
    />
  );
}

/** Cours de l'élève : demandes en attente, cours approuvés avec examens actifs, accès à l'inscription. */
export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const data = useStudentCourses();
  const [createOpen, setCreateOpen] = useState(false);
  const personal = data.offerings.filter((o) => o.is_personal);
  const school = data.offerings.filter((o) => !o.is_personal);
  const isEmpty = school.length === 0 && personal.length === 0 && data.pending_offerings.length === 0;
  const createButton = (
    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
      {he.createPersonalSubject}
    </Button>
  );

  return (
    <Box sx={{ width: "100%" }} dir="rtl">
      <ListPageToolbar
        title={he.myCourses}
        titleVariant="h5"
        subtitle={he.doubleClickCourseHint}
        actions={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {createButton}
            <JoinButton variant="contained" />
          </Box>
        }
      />
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
          <Box sx={{ mb: 4 }}>
            <SectionHeader title={he.personalSubjectsTitle} />
            <PersonalSection
              offerings={personal}
              counts={data.active_exam_counts}
              onOpen={(o) => navigate(`/student/courses/${o.id}`)}
            />
          </Box>
          {school.length > 0 && (
            <OfferingCardGrid
              offerings={school}
              onCardDoubleClick={(o) => navigate(`/student/courses/${o.id}`)}
              renderBadge={(o) => <ActiveExamsBadge offering={o} counts={data.active_exam_counts} />}
              renderFooter={(o) => <CourseExamsFooter offering={o} />}
            />
          )}
        </>
      )}
      <CreatePersonalSubjectDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={data.reload} />
    </Box>
  );
}
