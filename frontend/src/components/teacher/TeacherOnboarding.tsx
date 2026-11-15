import { Link } from "react-router-dom";
import { Box, Button, Card, LinearProgress, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { OPEN_CREATE_PARAM } from "../../config/createActions";
import { he } from "../../i18n/he";
import { brand, statusTones, surface } from "../../theme/brand";
import type { OnboardingStep } from "../../utils/teacherDashboard";

type StepCopy = { title: string; description: string; to: string };

const STEP_COPY: Record<OnboardingStep["key"], StepCopy> = {
  catalog: { title: he.onboardingCatalog, description: he.onboardingCatalogDesc, to: `/teacher/catalog-courses?${OPEN_CREATE_PARAM}=1` },
  offering: { title: he.onboardingOffering, description: he.onboardingOfferingDesc, to: `/teacher/courses?${OPEN_CREATE_PARAM}=1` },
  exam: { title: he.onboardingExam, description: he.onboardingExamDesc, to: "/teacher/exams/new" },
};

function StepMarker({ index, done, current }: { index: number; done: boolean; current: boolean }) {
  const filled = done || current;
  return (
    <Box
      aria-hidden
      sx={{
        width: 32,
        height: 32,
        flexShrink: 0,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "0.9rem",
        bgcolor: done ? statusTones.success.bg : filled ? brand.primary600 : surface.hover,
        color: done ? statusTones.success.fg : filled ? brand.white : brand.slate600,
      }}
    >
      {done ? <CheckIcon fontSize="small" /> : index + 1}
    </Box>
  );
}

function StepRow({ step, index, current }: { step: OnboardingStep; index: number; current: boolean }) {
  const copy = STEP_COPY[step.key];
  return (
    <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, gap: 1.5, py: 1.5, borderTop: index > 0 ? `1px solid ${surface.border}` : "none", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
      <StepMarker index={index} done={step.done} current={current} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontWeight={600} sx={{ color: step.done ? brand.slate600 : brand.slate900 }}>
          {copy.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {step.done ? he.onboardingDone : copy.description}
        </Typography>
      </Box>
      {!step.done && (
        <Button component={Link} to={copy.to} variant={current ? "contained" : "outlined"} sx={{ width: { xs: "100%", sm: "auto" } }}>
          {he.onboardingStart}
        </Button>
      )}
    </Box>
  );
}

/** Mise en route en 3 étapes (מקצוע → קורס → מטלה) ; disparaît une fois tout fait. */
export default function TeacherOnboarding({ steps }: { steps: OnboardingStep[] }) {
  const currentIndex = steps.findIndex((s) => !s.done);
  const done = steps.filter((s) => s.done).length;
  return (
    <Card sx={{ mb: 3, p: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="h6">{he.onboardingTitle}</Typography>
        <Typography variant="body2" color="text.secondary">{he.onboardingProgress(done, steps.length)}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
        {he.onboardingSubtitle} {he.onboardingWhy}
      </Typography>
      <LinearProgress variant="determinate" value={(done / steps.length) * 100} sx={{ my: 1.5, height: 6, borderRadius: 3, bgcolor: surface.hover }} />
      {steps.map((step, index) => (
        <StepRow key={step.key} step={step} index={index} current={index === currentIndex} />
      ))}
    </Card>
  );
}
