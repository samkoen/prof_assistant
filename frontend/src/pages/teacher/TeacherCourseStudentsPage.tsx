import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import GradingIcon from "@mui/icons-material/Grading";
import OfferingEnrollmentSettings from "../../components/OfferingEnrollmentSettings";
import ListPageToolbar from "../../components/ListPageToolbar";
import DataListTable from "../../components/DataListTable/DataListTable";
import StudentGradesDialog from "../../components/StudentGradesDialog";
import type { DataListColumnDef } from "../../components/DataListTable/types";
import {
  api,
  ApiError,
  offeringLabel,
  type CourseOffering,
  type Enrollment,
  type StudentAccount,
} from "../../api/client";
import { he } from "../../i18n/he";

export default function TeacherCourseStudentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = Number(courseId);
  const [course, setCourse] = useState<CourseOffering | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allStudents, setAllStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [gradesStudent, setGradesStudent] = useState<Enrollment | null>(null);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const [courses, enr, students] = await Promise.all([
        api<CourseOffering[]>("/api/courses/mine"),
        api<Enrollment[]>(`/api/courses/${id}/enrollments`),
        api<StudentAccount[]>("/api/students"),
      ]);
      setCourse(courses.find((c) => c.id === id) ?? null);
      setEnrollments(enr);
      setAllStudents(students);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const approvedIds = useMemo(
    () => new Set(enrollments.filter((e) => e.status === "approved").map((e) => e.student_id)),
    [enrollments]
  );

  const availableStudents = useMemo(
    () => allStudents.filter((s) => !approvedIds.has(s.id)),
    [allStudents, approvedIds]
  );

  const addToCourse = async () => {
    if (!selectedStudentId) {
      setError(he.selectStudent);
      return;
    }
    try {
      await api(`/api/courses/${id}/enrollments`, {
        method: "POST",
        body: JSON.stringify({ student_id: Number(selectedStudentId) }),
      });
      setOpen(false);
      setSelectedStudentId("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const removeFromCourse = async (enrollmentId: number) => {
    try {
      await api(`/api/enrollments/${enrollmentId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const statusLabel = (status: Enrollment["status"]) => {
    if (status === "approved") return he.approve;
    if (status === "pending") return he.pending;
    return he.reject;
  };

  const columns = useMemo<DataListColumnDef<Enrollment>[]>(
    () => [
      {
        key: "student_name",
        label: he.fullName,
        minWidth: 140,
        getValue: (e) => e.student_name,
        renderCell: (e) => e.student_name,
      },
      {
        key: "student_email",
        label: he.email,
        minWidth: 180,
        cellDir: "ltr",
        getValue: (e) => e.student_email,
        renderCell: (e) => e.student_email,
      },
      {
        key: "status",
        label: he.status,
        minWidth: 100,
        getValue: (e) => statusLabel(e.status),
        renderCell: (e) => (
          <Chip
            size="small"
            label={statusLabel(e.status)}
            color={
              e.status === "approved" ? "success" : e.status === "pending" ? "warning" : "error"
            }
          />
        ),
      },
    ],
    []
  );

  const title = course
    ? `${he.courseStudents}: ${offeringLabel(course)}`
    : he.courseStudents;

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <Box sx={{ mb: 1 }}>
        <Button component={RouterLink} to="/teacher/courses" startIcon={<ArrowBackIcon />} size="small">
          {he.backToCourses}
        </Button>
      </Box>

      <ListPageToolbar
        title={title}
        subtitle={he.manageCourseStudents}
        addLabel={he.addStudentToCourse}
        onAdd={() => setOpen(true)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {course && (
        <OfferingEnrollmentSettings
          offering={course}
          onUpdated={setCourse}
          onError={setError}
        />
      )}

      {loading && enrollments.length === 0 ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <DataListTable
          viewKey={`teacher-course-students-${id}`}
          rows={enrollments}
          columns={columns}
          loading={loading}
          emptyMessage={he.noStudents}
          getRowId={(e) => e.id}
          renderActions={(e) =>
            e.status === "approved" ? (
              <>
                <Tooltip title={he.viewStudentGrades}>
                  <IconButton size="small" color="primary" onClick={() => setGradesStudent(e)}>
                    <GradingIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={he.removeFromCourse}>
                  <IconButton size="small" color="error" onClick={() => removeFromCourse(e.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : null
          }
        />
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{he.addStudentToCourse}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {availableStudents.length === 0 ? (
            <Box color="text.secondary">{he.noStudents}</Box>
          ) : (
            <TextField
              select
              fullWidth
              label={he.selectStudent}
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              {availableStudents.map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>
                  {s.full_name} ({s.email})
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{he.cancel}</Button>
          <Button variant="contained" onClick={addToCourse} disabled={!selectedStudentId}>
            {he.submit}
          </Button>
        </DialogActions>
      </Dialog>

      {gradesStudent && (
        <StudentGradesDialog
          open={!!gradesStudent}
          offeringId={id}
          studentId={gradesStudent.student_id}
          studentName={gradesStudent.student_name}
          onClose={() => setGradesStudent(null)}
        />
      )}
    </Box>
  );
}
