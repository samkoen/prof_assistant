import { useCallback, useEffect, useMemo, useState } from "react";
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
  MenuItem,
  TextField,
} from "@mui/material";
import ListPageToolbar from "../../components/ListPageToolbar";
import DataListTable from "../../components/DataListTable/DataListTable";
import type { DataListColumnDef } from "../../components/DataListTable/types";
import { api, ApiError, offeringLabel, type CourseOffering } from "../../api/client";
import { he } from "../../i18n/he";

interface TeacherOption {
  id: number;
  full_name: string;
  email: string;
}

const CURRENT_YEAR = new Date().getFullYear();

export default function AdminCoursesPage() {
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    teacher_id: "",
    catalog_name: "",
    catalog_description: "",
    group_name: "",
    academic_year: String(CURRENT_YEAR),
    semester: "1",
    description: "",
    is_open_enrollment: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [coursesData, teachersData] = await Promise.all([
        api<CourseOffering[]>("/api/admin/courses"),
        api<TeacherOption[]>("/api/admin/teachers"),
      ]);
      setOfferings(coursesData);
      setTeachers(teachersData);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createOffering = async () => {
    if (!form.teacher_id) {
      setError(he.selectTeacher);
      return;
    }
    try {
      await api("/api/admin/courses", {
        method: "POST",
        body: JSON.stringify({
          teacher_id: Number(form.teacher_id),
          catalog_name: form.catalog_name,
          catalog_description: form.catalog_description || null,
          group_name: form.group_name,
          academic_year: Number(form.academic_year),
          semester: Number(form.semester),
          description: form.description || null,
          is_open_enrollment: form.is_open_enrollment,
        }),
      });
      setOpen(false);
      setForm({
        teacher_id: "",
        catalog_name: "",
        catalog_description: "",
        group_name: "",
        academic_year: String(CURRENT_YEAR),
        semester: "1",
        description: "",
        is_open_enrollment: true,
      });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const columns = useMemo<DataListColumnDef<CourseOffering>[]>(
    () => [
      {
        key: "catalog_name",
        label: he.subject,
        minWidth: 120,
        getValue: (c) => c.catalog_name,
        renderCell: (c) => c.catalog_name,
      },
      {
        key: "group_name",
        label: he.groupName,
        minWidth: 100,
        getValue: (c) => c.group_name,
        renderCell: (c) => c.group_name,
      },
      {
        key: "session",
        label: he.semester,
        minWidth: 120,
        getValue: (c) => offeringLabel(c),
        renderCell: (c) => offeringLabel(c),
      },
      {
        key: "teacher_name",
        label: he.teacher,
        minWidth: 140,
        getValue: (c) => c.teacher_name,
        renderCell: (c) => c.teacher_name,
      },
      {
        key: "enrollment",
        label: he.enrollment,
        minWidth: 100,
        getValue: (c) => (c.is_open_enrollment ? he.open : he.closed),
        renderCell: (c) => (
          <Chip
            label={c.is_open_enrollment ? he.open : he.closed}
            color={c.is_open_enrollment ? "success" : "default"}
            size="small"
          />
        ),
      },
    ],
    []
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <ListPageToolbar
        title={he.allCourses}
        subtitle={he.allCoursesSubtitle}
        addLabel={he.newCourse}
        onAdd={() => setOpen(true)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading && offerings.length === 0 ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <DataListTable
          viewKey="admin-courses"
          rows={offerings}
          columns={columns}
          loading={loading}
          emptyMessage={he.noCourses}
          getRowId={(c) => c.id}
        />
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{he.newCourse}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            select
            label={he.teacher}
            value={form.teacher_id}
            onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
            required
            fullWidth
            disabled={teachers.length === 0}
          >
            {teachers.map((t) => (
              <MenuItem key={t.id} value={String(t.id)}>
                {t.full_name} ({t.email})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={he.createCatalogCourse}
            value={form.catalog_name}
            onChange={(e) => setForm({ ...form, catalog_name: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label={he.groupName}
            value={form.group_name}
            onChange={(e) => setForm({ ...form, group_name: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label={he.academicYear}
            type="number"
            value={form.academic_year}
            onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
            fullWidth
          />
          <TextField
            select
            label={he.semester}
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
            fullWidth
          >
            <MenuItem value="1">סמסטר א</MenuItem>
            <MenuItem value="2">סמסטר ב</MenuItem>
          </TextField>
          <TextField
            select
            label={he.enrollment}
            value={form.is_open_enrollment ? "open" : "closed"}
            onChange={(e) => setForm({ ...form, is_open_enrollment: e.target.value === "open" })}
            fullWidth
          >
            <MenuItem value="open">{he.open}</MenuItem>
            <MenuItem value="closed">{he.closed}</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>{he.cancel}</Button>
          <Button variant="contained" onClick={createOffering} disabled={teachers.length === 0}>
            {he.submit}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
