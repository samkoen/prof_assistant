import { Alert } from "@mui/material";
import type { ExamTakeState } from "../../../hooks/examTake/useExamTake";
import { he } from "../../../i18n/he";
import { hebrewAlignRightSx } from "../../../styles/hebrewAlign";

const successSx = {
  mb: 2,
  ...hebrewAlignRightSx,
  "& .MuiAlert-message": { width: "100%", textAlign: "right", direction: "rtl" },
} as const;

/** Messages contextuels : alerte de temps, erreurs, succès et rappels de mode (officiel / entraînement). */
export default function ExamTakeBanners({ state }: { state: ExamTakeState }) {
  const { paper, error, success, phase, setError } = state.loader;
  const { timer, submitted, integrityActive } = state;
  if (!paper) return null;
  return (
    <>
      {timer.warning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {he.timeWarning} {paper.warning_minutes} {he.minutes}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && <Alert severity="success" sx={successSx}>{success}</Alert>}
      {phase === "exam" && !submitted && integrityActive && (
        <Alert severity="info" sx={{ mb: 2 }}>{he.examOfficialModeHint}</Alert>
      )}
      {phase === "practice" && <Alert severity="info" sx={{ mb: 2 }}>{he.practiceModeHint}</Alert>}
    </>
  );
}
