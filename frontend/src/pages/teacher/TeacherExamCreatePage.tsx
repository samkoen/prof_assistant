import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { api, ApiError, offeringLabel, type CatalogCourse, type CourseOffering } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import ListPageToolbar from "../../components/ListPageToolbar";
import { he } from "../../i18n/he";
import {
  hebrewFormActionsRightSx,
  hebrewFormColumnSx,
  hebrewFormFieldRowSx,
  hebrewFormFieldSx,
  hebrewFormSectionSx,
  hebrewRadioGroupSx,
  pageFullWidthSx,
} from "../../styles/hebrewAlign";

const emptyForm = {
  catalog_course_id: "",
  title: "",
  audience: "all" as "all" | "this_group",
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
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const returnTo = searchParams.get("return") || "/teacher/exams";
  const prefillCatalog = searchParams.get("catalog_course_id") || "";
  const prefillOfferingId = searchParams.get("offering_id") || "";
  const fromGroup = !!offering;

  useEffect(() => {
    Promise.all([
      api<CatalogCourse[]>("/api/catalog-courses/mine"),
      api<CourseOffering[]>("/api/courses/mine"),
    ])
      .then(([cats, offs]) => {
        setCatalogs(cats);
        if (prefillOfferingId) {
          const found = offs.find((o) => o.id === Number(prefillOfferingId)) ?? null;
          setOffering(found);
        }
      })
      .catch(() => setError(he.errorGeneric));
  }, [prefillOfferingId]);

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
      let scope_teacher_id: number | null = form.scope_teacher === "me" ? user?.id ?? null : null;
      let scope_academic_year: number | null = form.scope_academic_year
        ? Number(form.scope_academic_year)
        : null;
      let scope_semester: number | null = form.scope_semester ? Number(form.scope_semester) : null;
      let scope_group_name: string | null = form.scope_group_name.trim() || null;

      if (fromGroup && form.audience === "this_group" && offering) {
        scope_teacher_id = user?.id ?? null;
        scope_academic_year = offering.academic_year;
        scope_semester = offering.semester;
        scope_group_name = offering.group_name;
      } else if (fromGroup && form.audience === "all") {
        scope_teacher_id = user?.id ?? null;
        scope_academic_year = null;
        scope_semester = null;
        scope_group_name = null;
      }

      const exam = await api<{ id: number }>("/api/exams", {
        method: "POST",
        body: JSON.stringify({
          catalog_course_id: Number(form.catalog_course_id),
          title: form.title.trim() || "מבחן חדש",
          shuffle_questions: true,
          shuffle_options: true,
          scope_teacher_id,
          scope_academic_year,
          scope_semester,
          scope_group_name,
        }),
      });
      const editReturn = returnTo !== "/teacher/exams" ? `?return=${encodeURIComponent(returnTo)}` : "";
      navigate(`/teacher/exams/${exam.id}/edit${editReturn}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={pageFullWidthSx}>
      <ListPageToolbar
        title={he.createExam}
        subtitle={offering ? offeringLabel(offering) : undefined}
        titleVariant="h5"
        actions={
          <Button component={RouterLink} to={returnTo} startIcon={<ArrowBackIcon />} size="small">
            {he.cancel}
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box component="form" sx={hebrewFormColumnSx} onSubmit={(e) => e.preventDefault()}>
        <Box sx={hebrewFormFieldRowSx}>
          <TextField
            select
            size="small"
            label={he.selectCatalogCourse}
            value={form.catalog_course_id}
            onChange={(e) => setForm({ ...form, catalog_course_id: e.target.value })}
            required
            disabled={!!prefillCatalog}
            helperText={catalogs.length === 0 ? he.noCatalogCourses : undefined}
            sx={hebrewFormFieldSx}
          >
            {catalogs.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={hebrewFormFieldRowSx}>
          <TextField
            size="small"
            label={he.examTitle}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={hebrewFormFieldSx}
          />
        </Box>

        {fromGroup ? (
          <Box sx={hebrewFormSectionSx}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ width: "100%", textAlign: "right" }}
            >
              {he.examAudience}
            </Typography>
            <RadioGroup
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value as "all" | "this_group" })}
              sx={hebrewRadioGroupSx}
            >
              <FormControlLabel value="all" control={<Radio />} label={he.examAudienceAllGroups} />
              <FormControlLabel
                value="this_group"
                control={<Radio />}
                label={he.examAudienceThisGroup}
              />
            </RadioGroup>
          </Box>
        ) : (
          <Box sx={hebrewFormSectionSx}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ width: "100%", textAlign: "right" }}>
              {he.scopeRestriction}
            </Typography>
            <TextField
              select
              fullWidth
              label={he.teacher}
              value={form.scope_teacher}
              onChange={(e) => setForm({ ...form, scope_teacher: e.target.value as "any" | "me" })}
            >
              <MenuItem value="any">{he.scopeAnyTeacher}</MenuItem>
              <MenuItem value="me">{he.scopeOnlyMe}</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label={he.academicYear}
              value={form.scope_academic_year}
              onChange={(e) => setForm({ ...form, scope_academic_year: e.target.value })}
              placeholder={he.scopeAny}
            />
            <TextField
              select
              fullWidth
              label={he.semester}
              value={form.scope_semester}
              onChange={(e) => setForm({ ...form, scope_semester: e.target.value })}
            >
              <MenuItem value="">{he.scopeAny}</MenuItem>
              <MenuItem value="1">סמסטר א</MenuItem>
              <MenuItem value="2">סמסטר ב</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label={he.groupName}
              value={form.scope_group_name}
              onChange={(e) => setForm({ ...form, scope_group_name: e.target.value })}
              placeholder={he.scopeAny}
            />
          </Box>
        )}

        <Box sx={{ ...hebrewFormActionsRightSx, mt: 1 }}>
          <Button onClick={cancel}>{he.cancel}</Button>
          <DisabledActionTooltip
            disabled={saving || catalogs.length === 0}
            disabledReason={catalogs.length === 0 ? he.noCatalogCourses : undefined}
          >
            <Button variant="contained" onClick={submit}>
              {saving ? he.loading : he.submit}
            </Button>
          </DisabledActionTooltip>
        </Box>
      </Box>
    </Box>
  );
}
