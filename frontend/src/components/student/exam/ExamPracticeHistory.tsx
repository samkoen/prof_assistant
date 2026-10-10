import { Box, Typography } from "@mui/material";
import type { PracticeResult } from "../../../api/client";
import { he } from "../../../i18n/he";
import { softCardShadow, statusTones } from "../../../theme/brand";
import { scoreTone } from "../../../utils/studentExams";
import StatusChip from "../../ui/StatusChip";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function tone(row: PracticeResult) {
  return row.max_score ? scoreTone(Math.round((row.score / row.max_score) * 100)) : "neutral";
}

/** Historique des tentatives d'entraînement (la plus récente en premier). */
export default function ExamPracticeHistory({ results }: { results: PracticeResult[] }) {
  if (results.length === 0) return null;
  return (
    <Box dir="rtl" sx={{ mb: 3, p: 2, borderRadius: 3, bgcolor: "background.paper", boxShadow: softCardShadow }}>
      <Typography variant="subtitle1" fontWeight={800}>{he.practiceScoresHistory}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        {he.practiceScoreHint}
      </Typography>
      {results.map((row, index) => (
        <Box key={row.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.75, borderTop: index ? `1px solid ${statusTones.neutral.bg}` : "none" }}>
          <Typography variant="body2" fontWeight={600} sx={{ minWidth: 72 }}>
            {he.practiceRoundLabel(results.length - index)}
          </Typography>
          <StatusChip label={`${row.score} / ${row.max_score}`} tone={tone(row)} />
          <Typography variant="caption" color="text.secondary" dir="ltr" sx={{ marginInlineStart: "auto" }}>
            {formatDate(row.submitted_at)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
