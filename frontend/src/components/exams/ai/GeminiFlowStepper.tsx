import { Step, StepLabel, Stepper } from "@mui/material";
import { he } from "../../../i18n/he";
import type { GeminiFlowStep } from "../../../utils/geminiFlow";

const LABELS = [he.geminiStepBrief, he.geminiStepReview, he.geminiStepGenerate, he.geminiStepAccept];

/** Indicateur de progression du parcours AI (RTL : première étape à droite). */
export default function GeminiFlowStepper({ step }: { step: GeminiFlowStep }) {
  return (
    <Stepper activeStep={step} alternativeLabel dir="rtl" sx={{ mb: 3 }}>
      {LABELS.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
