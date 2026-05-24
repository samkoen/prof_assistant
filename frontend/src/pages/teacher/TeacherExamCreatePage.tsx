import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { api, ApiError, type CatalogCourse } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { he } from "../../i18n/he";

const emptyForm = {
  catalog_course_id: "",
  title: "",
  scope_teacher: "any" as "any" | "me",
  scope_academic_year: "",
  scope_semester: "",
  scope_group_name: "",
};

export default function TeacherExamCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const returnTo = searchParams.get("return") || "/teacher/exams";
  const prefillCatalog = searchParams.get("catalog_course_id") || "";

  useEffect(() => {
    api<CatalogCourse[]>("/api/catalog-courses/mine")
      .then(setCatalogs)
      .catch(() => setError(he.errorGeneric));
  }, []);

  useEffect(() => {
    if (prefillCatalog) {
      setForm((f) => ({ ...f, catalog_course_id: prefillCatalog }));
    }
  }, [prefillCatalog]);

  const cancel = () => navigate(returnTo);

  const submit = async () => {
    if (!form.catalog_course_id) {
      setError(he.selectCatalogCourse);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const exam = await api<{ id: number }>("/api/exams", {
        method: "POST",
        body: JSON.stringify({
          catalog_course_id: Number(form.catalog_course_id),
          title: form.title.trim() || "מבחן חדש",
          shuffle_questions: true,
          shuffle_options: true,
          scope_teacher_id: form.scope_teacher === "me" ? user?.id : null,
          scope_academic_year: form.scope_academic_year ? Number(form.scope_academic_year) : null,
          scope_semester: form.scope_semester ? Number(form.scope_semester) : null,
          scope_group_name: form.scope_group_name || null,
        }),
      });
      navigate(`/teacher/exams/${exam.id}/edit`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 560 }}>
      <Button
        component={RouterLink}
        to={returnTo}
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ mb: 2 }}
      >
        {he.cancel}
      </Button>

      <Typography variant="h5" fontWeight={700} gutterBottom>
        {he.createExam}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
        <TextField
          select
          label={he.selectCatalogCourse}
          value={form.catalog_course_id}
          onChange={(e) => setForm({ ...form, catalog_course_id: e.target.value })}
          required
          helperText={catalogs.length === 0 ? he.noCatalogCourses : undefined}
        >
          {catalogs.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={he.examTitle}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Typography variant="subtitle2" color="text.secondary">
          {he.scopeRestriction}
        </Typography>
        <TextField
          select
          label={he.teacher}
          value={form.scope_teacher}
          onChange={(e) => setForm({ ...form, scope_teacher: e.target.value as "any" | "me" })}
        >
          <MenuItem value="any">{he.scopeAnyTeacher}</MenuItem>
          <MenuItem value="me">{he.scopeOnlyMe}</MenuItem>
        </TextField>
        <TextField
          label={he.academicYear}
          value={form.scope_academic_year}
          onChange={(e) => setForm({ ...form, scope_academic_year: e.target.value })}
          placeholder={he.scopeAny}
        />
        <TextField
          select
          label={he.semester}
          value={form.scope_semester}
          onChange={(e) => setForm({ ...form, scope_semester: e.target.value })}
        >
          <MenuItem value="">{he.scopeAny}</MenuItem>
          <MenuItem value="1">סמסטר א</MenuItem>
          <MenuItem value="2">סמסטר ב</MenuItem>
        </TextField>
        <TextField
          label={he.groupName}
          value={form.scope_group_name}
          onChange={(e) => setForm({ ...form, scope_group_name: e.target.value })}
          placeholder={he.scopeAny}
        />
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1 }}>
          <Button onClick={cancel}>{he.cancel}</Button>
          <Button variant="contained" onClick={submit} disabled={saving || catalogs.length === 0}>
            {saving ? he.loading : he.submit}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
