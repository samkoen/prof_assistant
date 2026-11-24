import { Box, Typography } from "@mui/material";
import type { ExamSection } from "../../../api/client";
import { he } from "../../../i18n/he";
import { brand } from "../../../theme/brand";
import StatusChip from "../../ui/StatusChip";

type ExamSectionHeaderProps = {
  section: ExamSection;
  questionCount: number;
  /** N quand la partie impose de choisir N questions, sinon null. */
  required: number | null;
  points: number;
  /** Réponses déjà données dans la partie ; absent hors passation (correction, éditeur). */
  answered?: number;
};

/** En-tête d'une partie du sujet : titre, consigne, règle « N sur M » et avancement. */
export default function ExamSectionHeader({ section, questionCount, required, points, answered }: ExamSectionHeaderProps) {
  const rule = required == null ? he.examSectionAnswerAll(questionCount) : he.examSectionChooseRule(required, questionCount);
  const quota = required ?? questionCount;
  return (
    <Box dir="rtl" sx={{ mt: 3, mb: 1.5, pb: 1, borderBottom: `2px solid ${brand.primary100}`, textAlign: "right" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="h6" component="h2" fontWeight={800}>{section.title}</Typography>
        <StatusChip label={rule} tone={required == null ? "neutral" : "primary"} />
        <Typography variant="caption" color="text.secondary">{he.examSectionPoints(points)}</Typography>
        {answered != null && required != null && (
          <Box sx={{ marginInlineStart: "auto" }}>
            <StatusChip label={he.examSectionProgress(Math.min(answered, quota), quota)} tone={answered >= quota ? "success" : "warning"} />
          </Box>
        )}
      </Box>
      {section.instructions && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}>
          {section.instructions}
        </Typography>
      )}
    </Box>
  );
}
