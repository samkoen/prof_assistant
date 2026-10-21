import { Box, LinearProgress, Typography } from "@mui/material";
import type { ExamAttempt, PracticeResult } from "../../../api/client";
import { he } from "../../../i18n/he";
import { heroGradient, softCardShadow, statusTones } from "../../../theme/brand";
import { scorePercent, scoreTone } from "../../../utils/studentExams";
import ExamPracticeHistory from "./ExamPracticeHistory";

type ExamResultHeaderProps = {
  attempt: ExamAttempt;
  practiceResults: PracticeResult[];
  resultsPublished: boolean;
  practiceReview: boolean;
  gradingLocked?: boolean;
};

function ScoreHero({ title, score, max }: { title: string; score: number; max: number }) {
  const percent = scorePercent({ score, max_score: max }) ?? 0;
  const tone = statusTones[scoreTone(percent)];
  return (
    <Box dir="rtl" sx={{ mb: 3, p: 3, borderRadius: 3, color: "#fff", background: heroGradient, boxShadow: softCardShadow }}>
      <Typography variant="overline" sx={{ opacity: 0.85, fontWeight: 700 }}>{title}</Typography>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
        <Typography component="span" sx={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1.1 }}>{percent}%</Typography>
        <Typography component="span" sx={{ opacity: 0.9 }}>{he.examResultOutOf(score, max)}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.25)", "& .MuiLinearProgress-bar": { bgcolor: tone.bg } }}
      />
    </Box>
  );
}

function PendingCard() {
  return (
    <Box dir="rtl" sx={{ mb: 3, p: 3, borderRadius: 3, bgcolor: statusTones.info.bg, color: statusTones.info.fg }}>
      <Typography variant="subtitle1" fontWeight={800}>{he.examResultPendingTitle}</Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>{he.examResultsPending}</Typography>
    </Box>
  );
}

function NoGradeCard() {
  return (
    <Box dir="rtl" sx={{ mb: 3, p: 3, borderRadius: 3, bgcolor: statusTones.warning.bg, color: statusTones.warning.fg }}>
      <Typography variant="subtitle1" fontWeight={800}>{he.noGradeTitle}</Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>{he.gradingLockedStudent}</Typography>
    </Box>
  );
}

/** En-tête de la page résultat : score en grand, ou état « résultats en attente », puis historique d'entraînement. */
export default function ExamResultHeader({ attempt, practiceResults, resultsPublished, practiceReview, gradingLocked = false }: ExamResultHeaderProps) {
  const practice = !gradingLocked && practiceReview && attempt.practice_score != null && attempt.practice_max_score != null;
  const official = !practice && resultsPublished && attempt.score != null && attempt.max_score != null;
  const noGrade = gradingLocked && attempt.score == null && Boolean(attempt.submitted_at || practiceReview);
  return (
    <>
      {practice && <ScoreHero title={he.examResultPracticeTitle} score={attempt.practice_score as number} max={attempt.practice_max_score as number} />}
      {official && <ScoreHero title={he.examResultTitle} score={attempt.score as number} max={attempt.max_score as number} />}
      {noGrade && <NoGradeCard />}
      {!practice && !official && !noGrade && attempt.submitted_at && <PendingCard />}
      <ExamPracticeHistory results={practiceResults} />
    </>
  );
}
