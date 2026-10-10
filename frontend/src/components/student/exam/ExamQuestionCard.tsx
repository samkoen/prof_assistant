import { Box, Card, CardContent, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { StudentQuestion } from "../../../api/client";
import { he } from "../../../i18n/he";
import { examQuestionScrollMarginTop } from "../../../styles/layoutOffsets";
import { brand, softCardShadow, statusTones } from "../../../theme/brand";
import { contentDirForQuestionText, formatExamPointsLabel } from "../../../utils/examQuestionsLanguage";
import { examQuestionLtrSx } from "../../examQuestionLtrStyles";
import DirectionalMultilineField from "../../DirectionalMultilineField";
import QuestionImageDisplay from "../../QuestionImageDisplay";
import QuestionTextWithIndex from "../../QuestionTextWithIndex";
import ExamOptionRow from "./ExamOptionRow";

export type ExamQuestionCardProps = {
  elementId: string;
  index: number;
  question: StudentQuestion;
  selected: number[];
  textValue?: string;
  answered?: boolean;
  onSingle: (questionId: number, optionId: number) => void;
  onToggle: (questionId: number, optionId: number, checked: boolean) => void;
  onText: (questionId: number, value: string) => void;
};

function questionHint(question: StudentQuestion): string {
  if (question.question_type === "open") return he.examQuestionOpenKind;
  return question.question_type === "multiple" ? he.examQuestionSelectMany : he.examQuestionSelectOne;
}

function QuestionMeta({ question, dir, answered }: { question: StudentQuestion; dir: "ltr" | "rtl"; answered: boolean }) {
  const tone = statusTones.violet;
  return (
    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
      <Box component="span" sx={{ px: 1.25, py: 0.25, borderRadius: 999, bgcolor: tone.bg, color: tone.fg, fontSize: "0.75rem", fontWeight: 700 }}>
        {formatExamPointsLabel(question.points, dir)}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {questionHint(question)}
      </Typography>
      {answered && (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: statusTones.success.fg, marginInlineStart: "auto" }}>
          <CheckCircleIcon sx={{ fontSize: 18 }} />
          <Typography variant="caption" fontWeight={700}>{he.examQuestionAnswered}</Typography>
        </Box>
      )}
    </Box>
  );
}

function QuestionOptions(props: ExamQuestionCardProps & { ltr: boolean }) {
  const { question, selected, ltr, onSingle, onToggle } = props;
  const multiple = question.question_type === "multiple";
  return (
    <Box role={multiple ? "group" : "radiogroup"}>
      {question.options.map((o) => (
        <ExamOptionRow
          key={o.id}
          option={o}
          questionText={question.text}
          multiple={multiple}
          ltr={ltr}
          checked={selected.includes(o.id)}
          onChange={(checked) => (multiple ? onToggle(question.id, o.id, checked) : onSingle(question.id, o.id))}
        />
      ))}
    </Box>
  );
}

/** Carte d'une question : numéro, points, consigne, énoncé et zone de réponse. */
export default function ExamQuestionCard(props: ExamQuestionCardProps) {
  const { elementId, index, question, textValue = "", answered = false, onText } = props;
  const dir = contentDirForQuestionText(question.text);
  const ltr = dir === "ltr";
  return (
    <Card
      id={elementId}
      sx={{
        mb: 2,
        scrollMarginTop: examQuestionScrollMarginTop,
        boxShadow: softCardShadow,
        borderInlineStart: `4px solid ${answered ? statusTones.success.fg : brand.slate200}`,
        transition: "border-color .2s",
      }}
    >
      <CardContent dir={dir} sx={ltr ? examQuestionLtrSx : { textAlign: "right" }}>
        <QuestionMeta question={question} dir={dir} answered={answered} />
        <QuestionTextWithIndex index={index} text={question.text} gutterBottom />
        <QuestionImageDisplay url={question.image_url} />
        {question.question_type === "open" ? (
          <DirectionalMultilineField
            variant="mixed"
            label={he.openStudentAnswerLabel}
            value={textValue}
            onChange={(value) => onText(question.id, value)}
            minRows={4}
            maxRows={12}
            placeholder={he.openAnswerPlaceholder}
          />
        ) : (
          <QuestionOptions {...props} ltr={ltr} />
        )}
      </CardContent>
    </Card>
  );
}
