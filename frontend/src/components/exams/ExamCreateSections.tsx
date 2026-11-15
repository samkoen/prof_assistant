import type { ReactNode } from "react";
import { Box, Card, MenuItem, TextField, Typography } from "@mui/material";
import { brand } from "../../theme/brand";
import ChoiceCard from "../ui/ChoiceCard";
import type { CatalogCourse } from "../../api/client";
import { he } from "../../i18n/he";
import type { ExamCreateForm } from "../../utils/examCreatePayload";
import type { QuestionAddMethod } from "../../utils/examStartMethod";

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
        <TextField fullWidth label={he.examTitle} placeholder={he.createExamTitlePlaceholder} helperText={he.createExamTitleOptional} value={form.title} onChange={(e) => onChange({ title: e.target.value })} inputProps={{ maxLength: 255 }} />
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

const START_CHOICES: { method: QuestionAddMethod; title: string; description: string }[] = [
  { method: "gemini", title: he.addQuestionEmptyGemini, description: he.addQuestionEmptyGeminiDesc },
  { method: "paste", title: he.addQuestionEmptyPaste, description: he.addQuestionEmptyPasteDesc },
  { method: "manual", title: he.addQuestionEmptyManual, description: he.addQuestionManualHint },
];

/** Choix unique de la méthode de départ : l'éditeur s'ouvre directement sur cet outil. */
export function StartSection({ form, onChange, step }: FormProps & { step?: number }) {
  return (
    <FormSection title={he.createExamStart} step={step}>
      <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 1.5 }}>
        {he.createExamStartHint}
      </Typography>
      <Box role="radiogroup" sx={cardsRowSx}>
        {START_CHOICES.map((c) => (
          <ChoiceCard key={c.method} title={c.title} description={c.description} selected={form.start === c.method} onSelect={() => onChange({ start: c.method })} />
        ))}
      </Box>
    </FormSection>
  );
}
