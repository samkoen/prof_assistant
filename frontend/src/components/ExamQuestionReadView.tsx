import { Box, Chip, Typography } from "@mui/material";
import { OptionDisplay } from "./MultilineOptionLayout";
import { he } from "../i18n/he";

const typeLabel: Record<string, string> = {
  single: he.questionTypeSingle,
  multiple: he.questionTypeMultiple,
  true_false: he.questionTypeTrueFalse,
};

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
};

/** Affichage lecture seule — identique entre שאלות קיימות et תצוגה מקדימה. */
export function ExamQuestionReadView({
  index,
  text,
  questionType,
  points,
  options,
}: ExamQuestionReadViewProps) {
  return (
    <Box flex={1} minWidth={0} width="100%">
      <Typography
        fontWeight={600}
        component="div"
        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 0.5 }}
      >
        {index}. {text}
      </Typography>
      <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ mb: 0.5 }}>
        <Chip size="small" label={typeLabel[questionType] ?? questionType} />
        {points != null && (
          <Chip size="small" variant="outlined" label={`${points} נק'`} />
        )}
      </Box>
      {options.map((o, optIdx) => (
        <OptionDisplay
          key={o.id ?? optIdx}
          prefix={`${o.is_correct ? "✓" : "○"} ${String.fromCharCode(65 + optIdx)})`}
          text={o.text}
          color={o.is_correct ? "success.main" : "text.secondary"}
        />
      ))}
    </Box>
  );
}
