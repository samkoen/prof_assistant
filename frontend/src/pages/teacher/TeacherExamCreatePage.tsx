import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import { AudienceSection, BasicsSection, ScopeSection, TypeSection } from "../../components/exams/ExamCreateSections";
import ListPageToolbar from "../../components/ListPageToolbar";
import { offeringLabel, type CatalogCourse } from "../../api/client";
import { useExamCreate } from "../../hooks/useExamCreate";
import { he } from "../../i18n/he";
import { ensureCatalogOption } from "../../utils/examCreatePayload";

/** Création d'examen : sections claires, puis passage direct à l'éditeur de questions. */
export default function TeacherExamCreatePage({ forceTirgoul = false }: { forceTirgoul?: boolean }) {
  const c = useExamCreate({
    forceTirgoul,
    editorBase: forceTirgoul ? "/student/tirgoulim" : "/teacher/exams",
  });
  const backLabel = c.params.returnTo.includes("/exams") ? he.backToExams : he.backToCourses;
  const catalogs = catalogsForForm(c.catalogs, c.form.catalog_course_id, c.offering?.catalog_name ?? "");
  const noCatalogs = catalogs.length === 0;
  return (
    <Box dir="rtl" sx={{ maxWidth: 760, mx: "auto", width: "100%" }}>
      <ListPageToolbar
        title={forceTirgoul ? he.createTirgoul : he.createExam}
        subtitle={c.offering ? offeringLabel(c.offering) : he.createExamSubtitle}
        titleVariant="h5"
        actions={<BackButton to={c.params.returnTo} label={backLabel} />}
      />
      {c.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => c.setError("")}>{c.error}</Alert>}
      <Box component="form" onSubmit={(e) => e.preventDefault()}>
        {forceTirgoul && <Alert severity="info" sx={{ mb: 2 }}>{he.ownMatalaPrivate}</Alert>}
        <BasicsSection form={c.form} onChange={c.patch} catalogs={catalogs} lockCatalog={Boolean(c.params.catalogId)} />
        {!forceTirgoul && <TypeSection form={c.form} onChange={c.patch} />}
        {!forceTirgoul && (c.offering ? <AudienceSection form={c.form} onChange={c.patch} /> : <ScopeSection form={c.form} onChange={c.patch} />)}
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-start", flexWrap: "wrap" }}>
          <DisabledActionTooltip disabled={c.saving || noCatalogs} disabledReason={noCatalogs ? he.noCatalogCourses : undefined}>
            <Button variant="contained" size="large" endIcon={<ArrowForwardIcon sx={{ transform: "scaleX(-1)" }} />} onClick={c.submit}>
              {c.saving ? he.loading : he.createExamContinue}
            </Button>
          </DisabledActionTooltip>
          <Button size="large" onClick={c.reset}>{he.cancel}</Button>
        </Box>
      </Box>
    </Box>
  );
}

function catalogsForForm(catalogs: CatalogCourse[], catalogId: string, name: string): CatalogCourse[] {
  const extra: CatalogCourse = {
    id: Number(catalogId), name, description: null, teacher_id: null, teacher_name: "",
    exam_count: 0, exercise_count: 0, created_at: "",
  };
  return ensureCatalogOption(catalogs, catalogId, catalogId ? extra : null);
}

function BackButton({ to, label }: { to: string; label: string }) {
  return (
    <Button component={RouterLink} to={to} startIcon={<ArrowBackIcon />} size="small">
      {label}
    </Button>
  );
}
