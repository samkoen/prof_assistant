import { Box, Chip, Typography } from "@mui/material";
import { examQuestionLtrSx } from "./examQuestionLtrStyles";
import { LtrEmotionIsland } from "./LtrEmotionIsland";
import { OptionDisplay } from "./MultilineOptionLayout";
import { he } from "../i18n/he";

const typeLabelRtl: Record<string, string> = {
  single: he.questionTypeSingle,
  multiple: he.questionTypeMultiple,
  true_false: he.questionTypeTrueFalse,
};

const typeLabelLtr: Record<string, string> = {
  single: "Choix unique",
  multiple: "Choix multiple",
  true_false: "Vrai / faux",
};

function formatPointsLabel(points: number, ltr: boolean): string {
  if (ltr) return points === 1 ? "1 pt" : `${points} pts`;
  return `${points} נק'`;
}

export type ExamQuestionOptionView = {
  text: string;
  is_correct: boolean | null;
  id?: number;
};

type ExamQuestionReadViewProps = {
  index: number;
  text: string;
  questionType: string;
  points?: number;
  options: ExamQuestionOptionView[];
  /** Contenu de question/réponses (français, anglais…) — LTR aligné à gauche */
  contentDir?: "ltr" | "rtl";
};

/** Affichage lecture seule — identique entre שאלות קיימות et תצוגה מקדימה. */
export function ExamQuestionReadView({
  index,
  text,
  questionType,
  points,
  options,
  contentDir = "rtl",
}: ExamQuestionReadViewProps) {
  const ltr = contentDir === "ltr";
  const typeLabel = ltr ? typeLabelLtr : typeLabelRtl;
  const body = (
    <Box
      flex={1}
      minWidth={0}
      width="100%"
      dir={contentDir}
      sx={ltr ? examQuestionLtrSx : { textAlign: "start", direction: contentDir }}
    >
      <Typography
        fontWeight={600}
        component="div"
        dir={contentDir}
        sx={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          mb: 0.5,
          ...(ltr ? examQuestionLtrSx : { textAlign: "start", width: "100%" }),
        }}
      >
        {index}. {text}
      </Typography>
      <Box
        dir={contentDir}
        display="flex"
        flexDirection="row"
        justifyContent="flex-start"
        gap={0.5}
        flexWrap="wrap"
        sx={{ mb: 0.5, ...(ltr ? examQuestionLtrSx : {}) }}
      >
        <Chip size="small" label={typeLabel[questionType] ?? questionType} />
        {points != null && (
          <Chip size="small" variant="outlined" label={formatPointsLabel(points, ltr)} />
        )}
      </Box>
      {options.map((o, optIdx) => (
        <OptionDisplay
          key={o.id ?? optIdx}
          prefix={`${String.fromCharCode(65 + optIdx)}) ${o.is_correct ? "✓" : "○"}`}
          text={o.text}
          color={o.is_correct ? "success.main" : "text.secondary"}
          dir={contentDir}
        />
      ))}
    </Box>
  );
  if (ltr) return <LtrEmotionIsland>{body}</LtrEmotionIsland>;
  return body;
}
