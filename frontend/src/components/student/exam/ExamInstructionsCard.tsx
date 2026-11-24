import { Box, Card, CardContent, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { ExamSection } from "../../../api/client";
import { he } from "../../../i18n/he";
import { brand, softCardShadow } from "../../../theme/brand";
import { effectiveRequired, examMaxPoints, groupMaxPoints, groupQuestionsBySection, type QuestionGroup } from "../../../utils/examSections";

type InstructionQuestion = { id: number; section_id?: number | null; points: number; question_type: "single" | "multiple" | "open" };

type ExamInstructionsCardProps = {
  instructions?: string | null;
  questions: InstructionQuestion[];
  sections?: ExamSection[];
  scoreCap?: number | null;
};

function sectionRule(group: QuestionGroup<InstructionQuestion>): string {
  const total = group.items.length;
  const required = effectiveRequired(group.section, total);
  return required == null ? he.examSectionAnswerAll(total) : he.examSectionChooseRule(required, total);
}

function SectionSummary({ groups }: { groups: QuestionGroup<InstructionQuestion>[] }) {
  return (
    <Box component="ul" sx={{ m: 0, mt: 1, pr: 2.5, pl: 0 }}>
      {groups.map((group) => (
        <Typography key={group.section?.id ?? "none"} component="li" variant="body2" sx={{ mb: 0.25 }}>
          {group.section && <Box component="span" fontWeight={700}>{group.section.title} — </Box>}
          {sectionRule(group)} · {he.examSectionPoints(groupMaxPoints(group))}
        </Typography>
      ))}
    </Box>
  );
}

/** Ce qu'on attend de l'élève : consigne du professeur, règle de chaque partie et barème total. */
export default function ExamInstructionsCard({ instructions, questions, sections = [], scoreCap }: ExamInstructionsCardProps) {
  const text = (instructions ?? "").trim();
  const groups = groupQuestionsBySection(questions, sections);
  const hasSections = groups.some((group) => group.section);
  if (!text && !hasSections && scoreCap == null) return null;
  const rawTotal = examMaxPoints(questions, sections);
  return (
    <Card dir="rtl" sx={{ mb: 2, boxShadow: softCardShadow, borderInlineStart: `4px solid ${brand.primary600}` }}>
      <CardContent sx={{ textAlign: "right" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, color: brand.primary700 }}>
          <InfoOutlinedIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>{he.examInstructionsTitle}</Typography>
        </Box>
        {text && <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{text}</Typography>}
        {hasSections && <SectionSummary groups={groups} />}
        {(hasSections || scoreCap != null) && (
          <Typography variant="body2" fontWeight={700} sx={{ mt: 1 }}>
            {he.examTotalPointsNote(rawTotal)}
            {scoreCap != null && rawTotal > scoreCap ? ` — ${he.examScoreCapNote(scoreCap)}` : ""}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
