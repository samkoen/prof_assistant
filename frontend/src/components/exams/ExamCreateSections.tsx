import type { ReactNode } from "react";
import { Box, Card, MenuItem, TextField, Typography } from "@mui/material";
import { brand } from "../../theme/brand";
import ChoiceCard from "../ui/ChoiceCard";
import type { CatalogCourse } from "../../api/client";
import { he } from "../../i18n/he";
import type { ExamAudience, ExamCreateForm } from "../../utils/examCreatePayload";

type FormProps = {
  form: ExamCreateForm;
  onChange: (patch: Partial<ExamCreateForm>) => void;
};

function StepBadge({ step }: { step: number }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: brand.primary50, color: brand.primary700, fontWeight: 700, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
    >
      {step}
    </Box>
  );
}

/** Bloc numéroté du formulaire de création : on voit d'emblée combien d'étapes il reste. */
export function FormSection({ title, step, children }: { title: string; step?: number; children: ReactNode }) {
  return (
    <Card component="section" sx={{ mb: 2, p: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
        {step != null && <StepBadge step={step} />}
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
      </Box>
      {children}
    </Card>
  );
}

const cardsRowSx = { display: "flex", flexWrap: "wrap", gap: 1.5 } as const;

export function BasicsSection({ form, onChange, catalogs, lockCatalog, step }: FormProps & { catalogs: CatalogCourse[]; lockCatalog: boolean; step?: number }) {
  return (
    <FormSection title={he.createExamBasics} step={step}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          select
          required
          fullWidth
          label={he.selectCatalogCourse}
          value={form.catalog_course_id}
          disabled={lockCatalog}
          onChange={(e) => onChange({ catalog_course_id: e.target.value })}
          helperText={lockCatalog ? undefined : he.createExamCatalogHint}
        >
          {catalogs.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField fullWidth required label={he.examTitle} placeholder={he.createExamTitlePlaceholder} value={form.title} onChange={(e) => onChange({ title: e.target.value })} inputProps={{ maxLength: 255 }} />
      </Box>
    </FormSection>
  );
}

export function TypeSection({ form, onChange, step }: FormProps & { step?: number }) {
  return (
    <FormSection title={he.createExamType} step={step}>
      <Box role="radiogroup" sx={cardsRowSx}>
        <ChoiceCard title={he.createExamTypePractice} description={he.createExamTypePracticeHint} selected={form.kind === "tirgoul"} onSelect={() => onChange({ kind: "tirgoul", is_tirgoul: true })} />
        <ChoiceCard title={he.createExamTypeExam} description={he.createExamTypeExamHint} selected={form.kind === "official"} onSelect={() => onChange({ kind: "official", is_tirgoul: false })} />
        <ChoiceCard title={he.createExamTypeTask} description={he.createExamTypeTaskHint} selected={form.kind === "task"} onSelect={() => onChange({ kind: "task", is_tirgoul: false })} />
      </Box>
    </FormSection>
  );
}

export function AudienceSection({ form, onChange, step }: FormProps & { step?: number }) {
  const choose = (audience: ExamAudience) => () => onChange({ audience });
  return (
    <FormSection title={he.examAudience} step={step}>
      <Box role="radiogroup" sx={cardsRowSx}>
        <ChoiceCard title={he.examAudienceAllGroups} description={he.examAudienceAllHint} selected={form.audience === "all"} onSelect={choose("all")} />
        <ChoiceCard title={he.examAudienceThisGroup} description={he.examAudienceGroupHint} selected={form.audience === "this_group"} onSelect={choose("this_group")} />
      </Box>
    </FormSection>
  );
}

export function ScopeSection({ form, onChange, step }: FormProps & { step?: number }) {
  return (
    <FormSection title={he.scopeRestriction} step={step}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField fullWidth label={he.academicYear} value={form.scope_academic_year} placeholder={he.scopeAny} onChange={(e) => onChange({ scope_academic_year: e.target.value })} />
        <TextField select fullWidth label={he.semester} value={form.scope_semester} onChange={(e) => onChange({ scope_semester: e.target.value })}>
          <MenuItem value="">{he.scopeAny}</MenuItem>
          <MenuItem value="1">סמסטר א</MenuItem>
          <MenuItem value="2">סמסטר ב</MenuItem>
        </TextField>
        <TextField fullWidth label={he.groupName} value={form.scope_group_name} placeholder={he.scopeAny} onChange={(e) => onChange({ scope_group_name: e.target.value })} />
      </Box>
    </FormSection>
  );
}
