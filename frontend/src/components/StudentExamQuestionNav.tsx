import {
  Box,
  Button,
  LinearProgress,
  Typography,
  type Theme,
} from "@mui/material";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import type { StudentQuestion } from "../api/client";
import { he } from "../i18n/he";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { dashboardAppBarStickyTop } from "../styles/layoutOffsets";
import {
  countAnsweredQuestions,
  isQuestionAnswered,
} from "../utils/studentExamQuestionNav";

type StudentExamQuestionNavProps = {
  questions: StudentQuestion[];
  answers: Record<number, number[]>;
  activeIndex: number;
  onSelectQuestion: (index: number) => void;
  onNextUnanswered: () => void;
  allAnswered: boolean;
};

const compactFontSx = { fontSize: "0.75rem", lineHeight: 1.3 } as const;

function pillSx(answered: boolean, active: boolean) {
  return (theme: Theme) => ({
    ...compactFontSx,
    minWidth: 28,
    minHeight: 28,
    px: 0.5,
    py: 0,
    fontWeight: active ? 700 : 500,
    borderWidth: active ? 2 : 1,
    borderColor: active
      ? theme.palette.primary.main
      : answered
        ? theme.palette.success.main
        : theme.palette.divider,
    bgcolor: answered ? "rgba(76, 175, 80, 0.12)" : "background.paper",
    color: active ? "primary.main" : answered ? "success.dark" : "text.primary",
    boxShadow: active ? `0 0 0 1px ${theme.palette.primary.main}` : undefined,
  });
}

function NavPillsRow({
  questions,
  answers,
  activeIndex,
  onSelectQuestion,
  onNextUnanswered,
  allAnswered,
}: Pick<
  StudentExamQuestionNavProps,
  | "questions"
  | "answers"
  | "activeIndex"
  | "onSelectQuestion"
  | "onNextUnanswered"
  | "allAnswered"
>) {
  return (
    <Box
      dir="ltr"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        mt: 0.5,
      }}
    >
      <Button
        size="small"
        variant="outlined"
        startIcon={<SkipNextIcon sx={{ fontSize: "1rem !important" }} />}
        onClick={onNextUnanswered}
        disabled={allAnswered}
        sx={{
          ...compactFontSx,
          flexShrink: 0,
          minHeight: 28,
          py: 0.25,
          px: 1,
          whiteSpace: "nowrap",
        }}
      >
        {allAnswered ? he.examAllQuestionsAnswered : he.examNextUnanswered}
      </Button>
      <Box
        dir="rtl"
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          justifyContent: "flex-start",
          maxHeight: 64,
          overflowY: "auto",
        }}
      >
        {questions.map((q, i) => {
          const answered = isQuestionAnswered(answers, q.id);
          const active = i === activeIndex;
          return (
            <Button
              key={q.id}
              size="small"
              variant="outlined"
              onClick={() => onSelectQuestion(i)}
              aria-label={he.examQuestionNavLabel(i + 1)}
              aria-current={active ? "true" : undefined}
              sx={pillSx(answered, active)}
            >
              {i + 1}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

export default function StudentExamQuestionNav({
  questions,
  answers,
  activeIndex,
  onSelectQuestion,
  onNextUnanswered,
  allAnswered,
}: StudentExamQuestionNavProps) {
  const total = questions.length;
  const answeredCount = countAnsweredQuestions(questions, answers);
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <Box
      sx={{
        position: "sticky",
        top: dashboardAppBarStickyTop,
        zIndex: (theme) => theme.zIndex.appBar - 1,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        px: 1.5,
        py: 0.75,
        mb: 1.5,
        boxShadow: 1,
        ...hebrewAlignRightSx,
      }}
    >
      <Typography variant="caption" fontWeight={600} sx={{ ...compactFontSx, display: "block" }}>
        {he.examAnsweredProgress(answeredCount, total)}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={allAnswered ? "success" : "primary"}
        sx={{ mt: 0.5, mb: 0, height: 5, borderRadius: 1 }}
      />
      <NavPillsRow
        questions={questions}
        answers={answers}
        activeIndex={activeIndex}
        onSelectQuestion={onSelectQuestion}
        onNextUnanswered={onNextUnanswered}
        allAnswered={allAnswered}
      />
    </Box>
  );
}
