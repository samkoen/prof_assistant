import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import QuizIcon from "@mui/icons-material/Quiz";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import ListPageToolbar from "../../components/ListPageToolbar";
import { OfferingCardGrid } from "../../components/CourseCardGrid/CourseCardGrid";
import { api, ApiError, type CatalogCourse, type CourseOffering } from "../../api/client";
import { he } from "../../i18n/he";

const CURRENT_YEAR = new Date().getFullYear();
const NEW_CATALOG_ID = "__new__";

const emptyOfferingForm = () => ({
  catalog_course_id: "",
  group_name: "",
  academic_year: String(CURRENT_YEAR),
  semester: "1",
  description: "",
  is_open_enrollment: true,
  auto_approve_enrollment: false,
});

export default function TeacherCoursesPage() {
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyOfferingForm);
  const [newCatalog, setNewCatalog] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const isNewCatalog = form.catalog_course_id === NEW_CATALOG_ID;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [off, cats] = await Promise.all([
        api<CourseOffering[]>("/api/courses/mine"),
        api<CatalogCourse[]>("/api/catalog-courses/mine"),
      ]);
      setOfferings(off);
      setCatalogs(cats);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateDialog = () => {
    setForm({
      ...emptyOfferingForm(),
      catalog_course_id: catalogs.length === 0 ? NEW_CATALOG_ID : "",
    });
    setNewCatalog({ name: "", description: "" });
    setOpen(true);
  };

  const closeCreateDialog = () => {
    setOpen(false);
    setForm(emptyOfferingForm());
    setNewCatalog({ name: "", description: "" });
  };

  const resolveCatalogCourseId = async (): Promise<number> => {
    if (!isNewCatalog) return Number(form.catalog_course_id);
    const created = await api<CatalogCourse>("/api/catalog-courses", {
      method: "POST",
      body: JSON.stringify({
        name: newCatalog.name.trim(),
        description: newCatalog.description.trim() || null,
      }),
    });
    return created.id;
  };

  const createOffering = async () => {
    if (!form.catalog_course_id) {
      setError(he.selectCatalogCourse);
      return;
    }
    if (isNewCatalog && !newCatalog.name.trim()) {
      setError(he.subject);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const catalogCourseId = await resolveCatalogCourseId();
      await api("/api/courses", {
        method: "POST",
        body: JSON.stringify({
          catalog_course_id: catalogCourseId,
          group_name: form.group_name,
          academic_year: Number(form.academic_year),
          semester: Number(form.semester),
          description: form.description || null,
          is_open_enrollment: form.is_open_enrollment,
          auto_approve_enrollment: form.auto_approve_enrollment,
        }),
      });
      closeCreateDialog();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitOffering =
    !!form.catalog_course_id &&
    (!isNewCatalog || newCatalog.name.trim().length > 0) &&
    form.group_name.trim().length > 0;

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <ListPageToolbar
        title={he.myCourses}
        subtitle={he.offeringSubtitle}
        addLabel={he.createOffering}
        onAdd={openCreateDialog}
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
        <OfferingCardGrid
          offerings={offerings}
          emptyMessage={he.noCourses}
          renderActions={(o) => (
            <>
              <Tooltip title={he.manageCourseStudents}>
                <IconButton
                  component={RouterLink}
                  to={`/teacher/courses/${o.id}/students`}
                  size="small"
                  sx={{ color: "success.main" }}
                >
                  <GroupIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={he.manageCourseExams}>
                <IconButton
                  component={RouterLink}
                  to={`/teacher/courses/${o.id}/exams`}
                  size="small"
                  sx={{ color: "primary.main" }}
                >
                  <QuizIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        />
      )}

      <Dialog open={open} onClose={closeCreateDialog} fullWidth maxWidth="sm">
        <DialogTitle>{he.createOffering}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            select
            label={he.selectCatalogCourse}
            value={form.catalog_course_id}
            onChange={(e) => setForm({ ...form, catalog_course_id: e.target.value })}
            required
            fullWidth
          >
            <MenuItem value={NEW_CATALOG_ID}>{he.catalogCourseNew}</MenuItem>
            {catalogs.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          {isNewCatalog && (
            <>
              <TextField
                label={he.subject}
                value={newCatalog.name}
                onChange={(e) => setNewCatalog({ ...newCatalog, name: e.target.value })}
                required
                fullWidth
                placeholder="לדוגמה: מבני נתונים"
              />
              <TextField
                label={he.description}
                value={newCatalog.description}
                onChange={(e) => setNewCatalog({ ...newCatalog, description: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />
            </>
          )}
          <TextField
            label={he.groupName}
            value={form.group_name}
            onChange={(e) => setForm({ ...form, group_name: e.target.value })}
            required
          />
          <TextField
            label={he.academicYear}
            type="number"
            value={form.academic_year}
            onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
            required
          />
          <TextField
            select
            label={he.semester}
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
            <MenuItem value="1">סמסטר א</MenuItem>
            <MenuItem value="2">סמסטר ב</MenuItem>
          </TextField>
          <TextField
            label={he.description}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            multiline
            rows={2}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.is_open_enrollment}
                onChange={(e) => setForm({ ...form, is_open_enrollment: e.target.checked })}
              />
            }
            label={he.openEnrollmentLabel}
          />
          <Tooltip
            title={!form.is_open_enrollment ? he.autoApproveRequiresOpen : ""}
            disableHoverListener={form.is_open_enrollment}
            arrow
          >
            <span style={{ display: "inline-block" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.auto_approve_enrollment}
                    onChange={(e) =>
                      setForm({ ...form, auto_approve_enrollment: e.target.checked })
                    }
                    disabled={!form.is_open_enrollment}
                  />
                }
                label={he.autoApproveEnrollment}
              />
            </span>
          </Tooltip>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateDialog} disabled={submitting}>
            {he.cancel}
          </Button>
          <DisabledActionTooltip
            disabled={!canSubmitOffering || submitting}
            disabledReason={
              !form.catalog_course_id
                ? he.selectCatalogCourse
                : isNewCatalog && !newCatalog.name.trim()
                  ? he.subject
                  : !form.group_name.trim()
                    ? he.groupName
                    : undefined
            }
          >
            <Button variant="contained" onClick={createOffering} disabled={submitting}>
              {submitting ? he.loading : he.submit}
            </Button>
          </DisabledActionTooltip>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
