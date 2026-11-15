import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import { BasicsSection, StartSection, TypeSection } from "../../components/exams/ExamCreateSections";
import ListPageToolbar from "../../components/ListPageToolbar";
import { offeringLabel, type CatalogCourse } from "../../api/client";
import { OPEN_CREATE_PARAM } from "../../config/createActions";
import { useExamCreate } from "../../hooks/useExamCreate";
import { he } from "../../i18n/he";
import { ensureCatalogOption } from "../../utils/examCreatePayload";

function catalogsForForm(catalogs: CatalogCourse[], catalogId: string, name: string): CatalogCourse[] {
  const extra: CatalogCourse = {
    id: Number(catalogId), name, description: null, teacher_id: null, teacher_name: "",
    exam_count: 0, exercise_count: 0, created_at: "",
  };
  return ensureCatalogOption(catalogs, catalogId, catalogId ? extra : null);
}

function NeedsSubjectAlert() {
  return (
    <Alert
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Button component={RouterLink} to={`/teacher/catalog-courses?${OPEN_CREATE_PARAM}=1`} color="inherit" size="small">
          {he.createExamNeedsSubjectCta}
        </Button>
      }
    >
      {he.createExamNeedsSubject}
    </Alert>
  );
}

/** Création de מטלה : 3 blocs numérotés, puis passage direct à l'ajout des questions. */
export default function TeacherExamCreatePage({ forceTirgoul = false }: { forceTirgoul?: boolean }) {
  const c = useExamCreate({ forceTirgoul, editorBase: forceTirgoul ? "/student/tirgoulim" : "/teacher/exams" });
  const backLabel = c.params.returnTo.includes("/exams") ? he.backToExams : he.backToCourses;
  const catalogs = catalogsForForm(c.catalogs, c.form.catalog_course_id, c.offering?.catalog_name ?? "");
  const noCatalogs = catalogs.length === 0;
  return (
    <Box dir="rtl" sx={{ maxWidth: 760, mx: "auto", width: "100%" }}>
      <ListPageToolbar
        back={{ to: c.params.returnTo, label: backLabel }}
        title={forceTirgoul ? he.createTirgoul : he.createExam}
        subtitle={c.offering ? offeringLabel(c.offering) : he.createExamSubtitle}
        titleVariant="h5"
      />
      {c.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => c.setError("")}>{c.error}</Alert>}
      {!forceTirgoul && c.loaded && noCatalogs && <NeedsSubjectAlert />}
      <Box component="form" onSubmit={(e) => e.preventDefault()}>
        {forceTirgoul && <Alert severity="info" sx={{ mb: 2 }}>{he.ownMatalaPrivate}</Alert>}
        <BasicsSection step={forceTirgoul ? undefined : 1} form={c.form} onChange={c.patch} catalogs={catalogs} lockCatalog={Boolean(c.params.catalogId)} />
        {!forceTirgoul && <TypeSection step={2} form={c.form} onChange={c.patch} />}
        {c.form.kind !== "task" && <StartSection step={forceTirgoul ? undefined : 3} form={c.form} onChange={c.patch} />}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1, flexDirection: { xs: "column-reverse", sm: "row" } }}>
          <DisabledActionTooltip disabled={c.saving || noCatalogs} disabledReason={noCatalogs ? he.noCatalogCourses : undefined}>
            <Button variant="contained" size="large" endIcon={<ArrowBackIcon />} onClick={c.submit} sx={{ width: { xs: "100%", sm: "auto" } }}>
              {c.saving ? he.loading : c.form.kind === "task" ? he.createTaskContinue : he.createExamContinue}
            </Button>
          </DisabledActionTooltip>
          <Button size="large" component={RouterLink} to={c.params.returnTo}>{he.cancel}</Button>
        </Box>
      </Box>
    </Box>
  );
}
