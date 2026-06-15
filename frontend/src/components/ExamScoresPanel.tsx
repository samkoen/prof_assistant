import { Alert, Box, Typography } from "@mui/material";
import type { ExamAttempt, PracticeResult } from "../api/client";
import { he } from "../i18n/he";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";

type ExamScoresPanelProps = {
  attempt: ExamAttempt;
  practiceResults: PracticeResult[];
  showPracticeHint?: boolean;
};

function formatPracticeDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ExamScoresPanel({
  attempt,
  practiceResults,
  showPracticeHint = true,
}: ExamScoresPanelProps) {
  const showFinal = attempt.submitted_at && attempt.score != null && attempt.max_score != null;

  if (!showFinal && practiceResults.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3, ...hebrewAlignRightSx }} dir="rtl">
      {showFinal && (
        <Alert severity="success" sx={{ mb: practiceResults.length > 0 ? 2 : 0 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {he.finalExamScore}: {attempt.score} / {attempt.max_score}
          </Typography>
        </Alert>
      )}

      {practiceResults.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            {he.practiceScoresHistory}
          </Typography>
          {showPracticeHint && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              {he.practiceScoreHint}
            </Typography>
          )}
          {practiceResults.map((row, index) => (
            <Typography key={row.id} variant="body2" sx={{ mb: 0.5 }}>
              {he.practiceRoundLabel(practiceResults.length - index)}: {row.score} / {row.max_score}
              {" · "}
              <Box component="span" dir="ltr" sx={{ display: "inline-block" }}>
                {formatPracticeDate(row.submitted_at)}
              </Box>
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}
