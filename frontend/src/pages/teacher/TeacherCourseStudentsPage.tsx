import { useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Alert, Box, Button, Skeleton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AddStudentDialog from "../../components/courses/AddStudentDialog";
import CourseStudentRowActions from "../../components/courses/CourseStudentRowActions";
import CourseStudentsStats from "../../components/courses/CourseStudentsStats";
import DataListTable from "../../components/DataListTable/DataListTable";
import ListPageToolbar from "../../components/ListPageToolbar";
import OfferingEnrollmentSettings from "../../components/OfferingEnrollmentSettings";
import StudentGradesDialog from "../../components/StudentGradesDialog";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import ListSearchField from "../../components/ui/ListSearchField";
import { getCourseStudentColumns } from "../../config/courseStudentColumns";
import { offeringLabel, type Enrollment } from "../../api/client";
import { useCourseStudents } from "../../hooks/useCourseStudents";
import { useEnrollmentReview } from "../../hooks/useEnrollmentReview";
import { he } from "../../i18n/he";
import { countByStatus } from "../../utils/enrollmentStatus";
import { matchesQuery } from "../../utils/examFilters";

/** Étudiants d'un groupe : chiffres, ajout, approbation des demandes, notes et retrait confirmé. */
export default function TeacherCourseStudentsPage() {
  const id = Number(useParams<{ courseId: string }>().courseId);
  const data = useCourseStudents(id);
  const { reviewing, review } = useEnrollmentReview(() => void data.reload());
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gradesFor, setGradesFor] = useState<Enrollment | null>(null);
  const [toRemove, setToRemove] = useState<Enrollment | null>(null);
  const columns = useMemo(() => getCourseStudentColumns(), []);
  const counts = useMemo(() => countByStatus(data.enrollments), [data.enrollments]);
  const rows = useMemo(
    () => data.enrollments.filter((e) => matchesQuery([e.student_name, e.student_email], query)),
    [data.enrollments, query],
  );
  const confirmRemove = async () => {
    if (toRemove) await data.removeEnrollment(toRemove.id);
    setToRemove(null);
  };

  return (
    <Box dir="rtl" sx={{ width: "100%", minWidth: 0 }}>
      <Button component={RouterLink} to="/teacher/courses" startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1 }}>
        {he.backToCourses}
      </Button>
      <ListPageToolbar
        title={he.courseStudents}
        subtitle={data.course ? offeringLabel(data.course) : he.manageCourseStudents}
        titleVariant="h5"
        addLabel={he.addStudentToCourse}
        onAdd={() => setAddOpen(true)}
      />
      {data.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => data.setError("")}>{data.error}</Alert>}
      {data.course && <OfferingEnrollmentSettings offering={data.course} onUpdated={data.setCourse} onError={data.setError} />}
      <CourseStudentsStats counts={counts} />
      {data.loading ? (
        <Skeleton variant="rounded" height={200} />
      ) : data.enrollments.length === 0 ? (
        <EmptyState title={he.courseStudentsEmptyTitle} description={he.courseStudentsEmptyHint} icon={<PeopleOutlineIcon />} />
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <ListSearchField value={query} placeholder={he.courseStudentsSearch} onChange={setQuery} />
          </Box>
          <DataListTable
            viewKey={`teacher-course-students-${id}`}
            rows={rows}
            columns={columns}
            loading={false}
            emptyMessage={he.noStudents}
            getRowId={(e) => e.id}
            renderActions={(e) => (
              <CourseStudentRowActions enrollment={e} reviewing={reviewing} onReview={review} onShowGrades={setGradesFor} onRemove={setToRemove} />
            )}
          />
        </>
      )}
      <AddStudentDialog open={addOpen} candidates={data.candidates} onClose={() => setAddOpen(false)} onAdd={data.addStudent} />
      <ConfirmDialog
        open={Boolean(toRemove)}
        title={he.courseStudentsRemoveTitle}
        message={he.courseStudentsRemoveConfirm}
        detail={toRemove?.student_name}
        confirmLabel={he.removeFromCourse}
        color="error"
        onClose={() => setToRemove(null)}
        onConfirm={confirmRemove}
      />
      {gradesFor && (
        <StudentGradesDialog open offeringId={id} studentId={gradesFor.student_id} studentName={gradesFor.student_name} onClose={() => setGradesFor(null)} />
      )}
    </Box>
  );
}
