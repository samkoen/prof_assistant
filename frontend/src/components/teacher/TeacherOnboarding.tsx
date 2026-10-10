import { Link } from "react-router-dom";
import { alpha, Box, Button, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { he } from "../../i18n/he";
import { brand, statusTones } from "../../theme/brand";
import type { OnboardingStep } from "../../utils/teacherDashboard";

type StepCopy = { title: string; description: string; to: string };

const STEP_COPY: Record<OnboardingStep["key"], StepCopy> = {
  catalog: { title: he.onboardingCatalog, description: he.onboardingCatalogDesc, to: "/teacher/catalog-courses" },
  offering: { title: he.onboardingOffering, description: he.onboardingOfferingDesc, to: "/teacher/courses" },
  exam: { title: he.onboardingExam, description: he.onboardingExamDesc, to: "/teacher/exams/new" },
};

function StepIcon({ done }: { done: boolean }) {
  return done ? (
    <CheckCircleIcon sx={{ color: statusTones.success.fg }} />
  ) : (
    <RadioButtonUncheckedIcon sx={{ color: brand.violet400 }} />
  );
}

function StepRow({ step, current }: { step: OnboardingStep; current: boolean }) {
  const copy = STEP_COPY[step.key];
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, opacity: step.done ? 0.65 : 1 }}>
      <StepIcon done={step.done} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontWeight={700} sx={{ textDecoration: step.done ? "line-through" : "none" }}>
          {copy.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {copy.description}
        </Typography>
      </Box>
      {!step.done && (
        <Button component={Link} to={copy.to} size="small" variant={current ? "contained" : "outlined"}>
          {he.onboardingStart}
        </Button>
      )}
    </Box>
  );
}

/** Liste de démarrage : disparaît d'elle-même une fois les trois étapes faites. */
export default function TeacherOnboarding({ steps }: { steps: OnboardingStep[] }) {
  const currentIndex = steps.findIndex((s) => !s.done);
  return (
    <Box sx={{ mb: 3.5, p: 2.5, borderRadius: 3, bgcolor: alpha(brand.violet600, 0.05), border: `1px solid ${alpha(brand.violet600, 0.16)}` }}>
      <Typography variant="h6" fontWeight={800}>
        {he.onboardingTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {he.onboardingSubtitle}
      </Typography>
      {steps.map((step, index) => (
        <StepRow key={step.key} step={step} current={index === currentIndex} />
      ))}
    </Box>
  );
}
