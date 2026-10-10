import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import { AudienceSection, BasicsSection, ScopeSection, TypeSection } from "../../components/exams/ExamCreateSections";
import ListPageToolbar from "../../components/ListPageToolbar";
import { offeringLabel } from "../../api/client";
import { useExamCreate } from "../../hooks/useExamCreate";
import { he } from "../../i18n/he";

/** Création d'examen : sections claires, puis passage direct à l'éditeur de questions. */
export default function TeacherExamCreatePage() {
  const c = useExamCreate();
  const backLabel = c.params.returnTo.includes("/exams") ? he.backToExams : he.backToCourses;
  const noCatalogs = c.catalogs.length === 0;
  return (
    <Box dir="rtl" sx={{ maxWidth: 760, mx: "auto", width: "100%" }}>
      <ListPageToolbar
        title={he.createExam}
        subtitle={c.offering ? offeringLabel(c.offering) : he.createExamSubtitle}
        titleVariant="h5"
        actions={<BackButton to={c.params.returnTo} label={backLabel} />}
      />
      {c.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => c.setError("")}>{c.error}</Alert>}
      <Box component="form" onSubmit={(e) => e.preventDefault()}>
        <BasicsSection form={c.form} onChange={c.patch} catalogs={c.catalogs} lockCatalog={Boolean(c.params.catalogId)} />
        <TypeSection form={c.form} onChange={c.patch} />
        {c.offering ? <AudienceSection form={c.form} onChange={c.patch} /> : <ScopeSection form={c.form} onChange={c.patch} />}
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

function BackButton({ to, label }: { to: string; label: string }) {
  return (
    <Button component={RouterLink} to={to} startIcon={<ArrowBackIcon />} size="small">
      {label}
    </Button>
  );
}
