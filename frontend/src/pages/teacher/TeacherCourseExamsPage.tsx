import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Skeleton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import AddExistingExamDialog from "../../components/AddExistingExamDialog";
import EmptyState from "../../components/ui/EmptyState";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CourseSectionTabs from "../../components/courses/CourseSectionTabs";
import DataListTable from "../../components/DataListTable/DataListTable";
import ExamsStatusTabs, { type ExamsStatusTab } from "../../components/ExamsStatusTabs";
import ExamOfferingRowActions from "../../components/ExamOfferingRowActions";
import ListPageToolbar from "../../components/ListPageToolbar";
import {
  COURSE_EXAMS_DEFAULT_SORT,
  courseExamRowSx,
  getCourseExamTableColumns,
} from "../../config/courseExamTableColumns";
import { offeringLabel, type CourseOffering } from "../../api/client";
import { useOfferingExamsBoard } from "../../hooks/useOfferingExamsBoard";
import { he } from "../../i18n/he";

function createExamPath(offering: CourseOffering): string {
  const back = encodeURIComponent(`/teacher/courses/${offering.id}/exams`);
  return `/teacher/exams/new?catalog_course_id=${offering.catalog_course_id}&offering_id=${offering.id}&return=${back}`;
}

/** Examens d'un groupe : onglets ouverts / clôturés, création et rattachement d'un examen existant. */
export default function TeacherCourseExamsPage() {
  const id = Number(useParams<{ courseId: string }>().courseId);
  const navigate = useNavigate();
  const board = useOfferingExamsBoard(id);
  const { offering } = board;
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState<ExamsStatusTab>("open");
  const columns = useMemo(() => getCourseExamTableColumns(), []);
  const rows = tab === "closed" ? board.closedRows : board.openRows;

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }} dir="rtl">
      <ListPageToolbar
        titleVariant="h5"
        back={{ to: "/teacher/courses", label: he.backToCourses }}
        title={offering ? offeringLabel(offering) : he.manageCourseExams}
        actions={
          offering && (
            <>
              <Button variant="outlined" startIcon={<PlaylistAddIcon />} onClick={() => setAddExistingOpen(true)}>
                {he.addExistingExam}
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(createExamPath(offering))}>
                {he.createMenuExam}
              </Button>
            </>
          )
        }
      />
      <CourseSectionTabs courseId={id} value="exams" />
      {board.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => board.setError("")}>{board.error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}
      {board.loading ? (
        <Skeleton variant="rounded" height={260} />
      ) : board.openRows.length + board.closedRows.length === 0 ? (
        <EmptyState
          title={he.courseExamsEmptyTitle}
          description={he.courseExamsEmptyHint}
          icon={<AssignmentOutlinedIcon />}
          action={offering && <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(createExamPath(offering))}>{he.createMenuExam}</Button>}
        />
      ) : (
        <>
          <ExamsStatusTabs value={tab} onChange={setTab} openCount={board.openRows.length} closedCount={board.closedRows.length} />
          <DataListTable
            viewKey={`teacher-course-exams-${id}-${tab}`}
            rows={rows}
            columns={columns}
            loading={false}
            emptyMessage={tab === "closed" ? he.noClosedExams : he.noExams}
            getRowId={(row) => row.exam.id}
            defaultSort={COURSE_EXAMS_DEFAULT_SORT}
            getRowSx={courseExamRowSx}
            actionsColumnPx={300}
            renderActions={(row) => (
              <ExamOfferingRowActions
                exam={row.exam}
                session={row.session}
                courseId={id}
                hasQuestions={row.exam.question_count > 0}
                returnTo={`/teacher/courses/${id}/exams`}
                onChanged={board.reload}
                onError={board.setError}
                onSuccess={setSuccess}
                onReopened={() => setTab("open")}
              />
            )}
          />
        </>
      )}
      {offering && (
        <AddExistingExamDialog
          open={addExistingOpen}
          offering={offering}
          visibleExamIds={board.exams.map((e) => e.id)}
          onClose={() => setAddExistingOpen(false)}
          onAttached={async () => {
            setSuccess(he.examAddedToGroup);
            await board.reload();
          }}
        />
      )}
    </Box>
  );
}
