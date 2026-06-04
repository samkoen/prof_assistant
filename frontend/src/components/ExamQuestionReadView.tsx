import { Box, Chip } from "@mui/material";
import { examQuestionLtrSx } from "./examQuestionLtrStyles";
import { LtrEmotionIsland } from "./LtrEmotionIsland";
import QuestionTextWithIndex from "./QuestionTextWithIndex";
import { OptionDisplay } from "./MultilineOptionLayout";
import QuestionImageDisplay from "./QuestionImageDisplay";
import { he } from "../i18n/he";
import { contentDirForQuestionText } from "../utils/examQuestionsLanguage";

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
  image_url?: string | null;
};

type ExamQuestionReadViewProps = {
  index: number;
  text: string;
  imageUrl?: string | null;
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
  imageUrl,
  questionType,
  points,
  options,
}: ExamQuestionReadViewProps) {
  const qDir = contentDirForQuestionText(text);
  const ltr = qDir === "ltr";
  const typeLabel = ltr ? typeLabelLtr : typeLabelRtl;
  const body = (
    <Box
      flex={1}
      minWidth={0}
      width="100%"
      dir={qDir}
      sx={ltr ? examQuestionLtrSx : { textAlign: "right", direction: "rtl" }}
    >
      <QuestionTextWithIndex index={index} text={text} sx={{ mb: 0.5 }} />
      <QuestionImageDisplay url={imageUrl} />
      <Box
        dir={qDir}
        display="flex"
        flexDirection="row"
        justifyContent="flex-start"
        gap={0.5}
        flexWrap="wrap"
        sx={{ mb: 0.5, ...(ltr ? examQuestionLtrSx : { width: "100%" }) }}
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
          imageUrl={o.image_url}
          color={o.is_correct ? "success.main" : "text.secondary"}
          dir={contentDirForQuestionText(o.text)}
          examDir={qDir}
        />
      ))}
    </Box>
  );
  if (ltr) return <LtrEmotionIsland>{body}</LtrEmotionIsland>;
  return body;
}
