import type { ReactNode } from "react";
import { Box, MenuItem, TextField, Typography } from "@mui/material";
import ChoiceCard from "../ui/ChoiceCard";
import type { CatalogCourse } from "../../api/client";
import { he } from "../../i18n/he";
import type { ExamAudience, ExamCreateForm } from "../../utils/examCreatePayload";

type FormProps = {
  form: ExamCreateForm;
  onChange: (patch: Partial<ExamCreateForm>) => void;
};

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mb: 3.5 }}>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

const cardsRowSx = { display: "flex", flexWrap: "wrap", gap: 1.5 } as const;

export function BasicsSection({ form, onChange, catalogs, lockCatalog }: FormProps & { catalogs: CatalogCourse[]; lockCatalog: boolean }) {
  return (
    <FormSection title={he.createExamBasics}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          select
          required
          fullWidth
          label={he.selectCatalogCourse}
          value={form.catalog_course_id}
          disabled={lockCatalog}
          onChange={(e) => onChange({ catalog_course_id: e.target.value })}
          helperText={catalogs.length === 0 ? he.noCatalogCourses : undefined}
        >
          {catalogs.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField fullWidth label={he.examTitle} value={form.title} onChange={(e) => onChange({ title: e.target.value })} inputProps={{ maxLength: 255 }} />
      </Box>
    </FormSection>
  );
}

export function TypeSection({ form, onChange }: FormProps) {
  return (
    <FormSection title={he.createExamType}>
      <Box role="radiogroup" sx={cardsRowSx}>
        <ChoiceCard title={he.createExamTypePractice} description={he.createExamTypePracticeHint} selected={form.is_tirgoul} onSelect={() => onChange({ is_tirgoul: true })} />
        <ChoiceCard title={he.createExamTypeExam} description={he.createExamTypeExamHint} selected={!form.is_tirgoul} onSelect={() => onChange({ is_tirgoul: false })} />
      </Box>
    </FormSection>
  );
}

export function AudienceSection({ form, onChange }: FormProps) {
  const choose = (audience: ExamAudience) => () => onChange({ audience });
  return (
    <FormSection title={he.examAudience}>
      <Box role="radiogroup" sx={cardsRowSx}>
        <ChoiceCard title={he.examAudienceAllGroups} description={he.examAudienceAllHint} selected={form.audience === "all"} onSelect={choose("all")} />
        <ChoiceCard title={he.examAudienceThisGroup} description={he.examAudienceGroupHint} selected={form.audience === "this_group"} onSelect={choose("this_group")} />
      </Box>
    </FormSection>
  );
}

export function ScopeSection({ form, onChange }: FormProps) {
  return (
    <FormSection title={he.scopeRestriction}>
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
