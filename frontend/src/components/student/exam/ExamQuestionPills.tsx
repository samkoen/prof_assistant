import { Box } from "@mui/material";
import type { StudentQuestion } from "../../../api/client";
import { he } from "../../../i18n/he";
import { brand, statusTones } from "../../../theme/brand";
import { isQuestionAnswered } from "../../../utils/studentExamQuestionNav";

type ExamQuestionPillsProps = {
  questions: StudentQuestion[];
  answers: Record<number, number[]>;
  textAnswers: Record<number, string>;
  activeIndex: number;
  onSelect: (index: number) => void;
};

function pillSx(answered: boolean, active: boolean) {
  const done = statusTones.success;
  return {
    width: 30,
    height: 30,
    borderRadius: 1.5,
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: active ? 800 : 600,
    border: "1.5px solid",
    borderColor: active ? brand.violet600 : answered ? done.fg : brand.slate200,
    bgcolor: answered ? done.bg : "background.paper",
    color: active ? brand.violet700 : answered ? done.fg : brand.slate600,
    boxShadow: active ? `0 0 0 2px ${brand.violet100}` : "none",
    "&:hover": { borderColor: brand.violet500 },
  } as const;
}

/** Pastilles de navigation : vert = répondu, bordure violette = question affichée. */
export default function ExamQuestionPills(props: ExamQuestionPillsProps) {
  const { questions, answers, textAnswers, activeIndex, onSelect } = props;
  return (
    <Box dir="rtl" sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxHeight: 72, overflowY: "auto", py: 0.25 }}>
      {questions.map((q, i) => (
        <Box
          key={q.id}
          component="button"
          type="button"
          onClick={() => onSelect(i)}
          aria-label={he.examQuestionNavLabel(i + 1)}
          aria-current={i === activeIndex ? "true" : undefined}
          sx={pillSx(isQuestionAnswered(q, answers, textAnswers), i === activeIndex)}
        >
          {i + 1}
        </Box>
      ))}
    </Box>
  );
}
