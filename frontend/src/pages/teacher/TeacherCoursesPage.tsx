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

export default function TeacherCoursesPage() {
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    catalog_course_id: "",
    group_name: "",
    academic_year: String(CURRENT_YEAR),
    semester: "1",
    description: "",
    is_open_enrollment: true,
    auto_approve_enrollment: false,
  });

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

  const createOffering = async () => {
    if (!form.catalog_course_id) {
      setError(he.selectCatalogCourse);
      return;
    }
    try {
      await api("/api/courses", {
        method: "POST",
        body: JSON.stringify({
          catalog_course_id: Number(form.catalog_course_id),
          group_name: form.group_name,
          academic_year: Number(form.academic_year),
          semester: Number(form.semester),
          description: form.description || null,
          is_open_enrollment: form.is_open_enrollment,
          auto_approve_enrollment: form.auto_approve_enrollment,
        }),
      });
      setOpen(false);
      setForm({
        catalog_course_id: "",
        group_name: "",
        academic_year: String(CURRENT_YEAR),
        semester: "1",
        description: "",
        is_open_enrollment: true,
        auto_approve_enrollment: false,
      });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <ListPageToolbar
        title={he.myCourses}
        subtitle={he.offeringSubtitle}
        addLabel={he.createOffering}
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{he.createOffering}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
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
          <Button onClick={() => setOpen(false)}>{he.cancel}</Button>
          <DisabledActionTooltip
            disabled={catalogs.length === 0}
            disabledReason={catalogs.length === 0 ? he.noCatalogCourses : undefined}
          >
            <Button variant="contained" onClick={createOffering}>
              {he.submit}
            </Button>
          </DisabledActionTooltip>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
