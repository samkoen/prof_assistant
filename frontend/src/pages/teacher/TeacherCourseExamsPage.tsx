import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import AddExistingExamDialog from "../../components/AddExistingExamDialog";
import DataListTable from "../../components/DataListTable/DataListTable";
import ExamsStatusTabs, { type ExamsStatusTab } from "../../components/ExamsStatusTabs";
import ExamOfferingRowActions from "../../components/ExamOfferingRowActions";
import ListPageToolbar from "../../components/ListPageToolbar";
import { getCourseExamTableColumns } from "../../config/courseExamTableColumns";
import {
  api,
  ApiError,
  offeringLabel,
  type CourseOffering,
  type Exam,
  type ExamSession,
  type TeacherOfferingExamsBoard,
} from "../../api/client";
import { he } from "../../i18n/he";

export default function TeacherCourseExamsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = Number(courseId);
  const navigate = useNavigate();
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [examsTab, setExamsTab] = useState<ExamsStatusTab>("open");

  const columns = useMemo(() => getCourseExamTableColumns(), []);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const board = await api<TeacherOfferingExamsBoard>(
        `/api/exams/sessions/offering/${id}/teacher-board`,
      );
      setOffering(board.offering);
      setExams(board.exams);
      setSessions(board.sessions);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const sessionByExamId = useMemo(() => {
    const map = new Map<number, ExamSession>();
    for (const s of sessions) {
      map.set(s.exam_id, s);
    }
    return map;
  }, [sessions]);

  const tableRows = useMemo(
    () => exams.map((exam) => ({ exam, session: sessionByExamId.get(exam.id) })),
    [exams, sessionByExamId],
  );

  const openRows = useMemo(
    () => tableRows.filter((row) => row.session?.status !== "closed"),
    [tableRows],
  );
  const closedRows = useMemo(
    () => tableRows.filter((row) => row.session?.status === "closed"),
    [tableRows],
  );
  const visibleRows = examsTab === "closed" ? closedRows : openRows;

  if (loading && !offering) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }} dir="rtl">
      <Button
        component={RouterLink}
        to="/teacher/courses"
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ mb: 2 }}
      >
        {he.backToCourses}
      </Button>

      <ListPageToolbar
        titleVariant="h5"
        title={
          <>
            {he.manageCourseExams}
            {offering && (
              <Box
                component="span"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  fontSize: "1.125rem",
                  whiteSpace: "nowrap",
                }}
              >
                {" · "}
                {offeringLabel(offering)}
              </Box>
            )}
          </>
        }
        actions={
          offering ? (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                onClick={() =>
                  navigate(
                    `/teacher/exams/new?catalog_course_id=${offering.catalog_course_id}&offering_id=${offering.id}&return=${encodeURIComponent(`/teacher/courses/${id}/exams`)}`
                  )
                }
              >
                {he.createExam}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PlaylistAddIcon />}
                size="small"
                onClick={() => setAddExistingOpen(true)}
              >
                {he.addExistingExam}
              </Button>
            </>
          ) : undefined
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <ExamsStatusTabs
        value={examsTab}
        onChange={setExamsTab}
        openCount={openRows.length}
        closedCount={closedRows.length}
      />

      <DataListTable
        viewKey={`teacher-course-exams-${id}-${examsTab}`}
        rows={visibleRows}
        columns={columns}
        loading={loading}
        emptyMessage={examsTab === "closed" ? he.noClosedExams : he.noExams}
        getRowId={(row) => row.exam.id}
        actionsColumnPx={320}
        renderActions={(row) => (
          <ExamOfferingRowActions
            exam={row.exam}
            session={row.session}
            courseId={id}
            hasQuestions={row.exam.question_count > 0}
            returnTo={`/teacher/courses/${id}/exams`}
            onChanged={load}
            onError={setError}
            onSuccess={setSuccess}
            onReopened={() => setExamsTab("open")}
          />
        )}
      />

      {offering && (
        <AddExistingExamDialog
          open={addExistingOpen}
          offering={offering}
          visibleExamIds={exams.map((e) => e.id)}
          onClose={() => setAddExistingOpen(false)}
          onAttached={async () => {
            setSuccess(he.examAddedToGroup);
            await load();
          }}
        />
      )}
    </Box>
  );
}
