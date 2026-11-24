import { Box, Button, LinearProgress, Typography } from "@mui/material";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import type { StudentQuestion } from "../../../api/client";
import { he } from "../../../i18n/he";
import { softCardShadow, statusTones } from "../../../theme/brand";
import type { TimerLevel } from "../../../utils/examTake";
import StatusChip from "../../ui/StatusChip";
import ExamQuestionPills from "./ExamQuestionPills";
import ExamTimerChip from "./ExamTimerChip";

export type ExamTopBarProps = {
  title: string;
  isTirgoul: boolean;
  timer: { visible: boolean; timeLeft: string; level: TimerLevel };
  questions: StudentQuestion[];
  answers: Record<number, number[]>;
  textAnswers: Record<number, string>;
  activeIndex: number;
  /** Réponses données / attendues (une partie « N sur M » n'en attend que N). */
  progress: { answered: number; required: number };
  allAnswered: boolean;
  onSelect: (index: number) => void;
  onNextUnanswered: () => void;
};

const barSx = {
  position: "sticky",
  top: 60,
  zIndex: (theme: { zIndex: { appBar: number } }) => theme.zIndex.appBar - 1,
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 3,
  px: 2,
  py: 1.25,
  mb: 2,
  boxShadow: softCardShadow,
} as const;

function TitleRow({ title, isTirgoul, timer }: Pick<ExamTopBarProps, "title" | "isTirgoul" | "timer">) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap>{title}</Typography>
        {isTirgoul && <StatusChip label={he.tirgoulChip} tone="info" />}
      </Box>
      {timer.visible && <ExamTimerChip timeLeft={timer.timeLeft} level={timer.level} />}
    </Box>
  );
}

function ProgressRow(props: Pick<ExamTopBarProps, "progress" | "allAnswered" | "onNextUnanswered">) {
  const { progress, allAnswered, onNextUnanswered } = props;
  const total = progress.required;
  const done = progress.answered;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          {he.examAnsweredProgress(done, total)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={total > 0 ? Math.round((done / total) * 100) : 0}
          sx={{ mt: 0.5, height: 6, borderRadius: 3, "& .MuiLinearProgress-bar": allAnswered ? { bgcolor: statusTones.success.fg } : {} }}
        />
      </Box>
      <Button size="small" variant="outlined" startIcon={<SkipNextIcon />} onClick={onNextUnanswered} disabled={allAnswered}>
        {allAnswered ? he.examAllQuestionsAnswered : he.examNextUnanswered}
      </Button>
    </Box>
  );
}

/** Barre collante de l'examen : titre, minuteur, progression et navigation entre les questions. */
export default function ExamTopBar(props: ExamTopBarProps) {
  const { title, isTirgoul, timer, questions, answers, textAnswers, activeIndex, progress, allAnswered, onSelect, onNextUnanswered } = props;
  return (
    <Box dir="rtl" sx={barSx}>
      <TitleRow title={title} isTirgoul={isTirgoul} timer={timer} />
      <ProgressRow
        progress={progress}
        allAnswered={allAnswered}
        onNextUnanswered={onNextUnanswered}
      />
      <Box sx={{ mt: 1 }}>
        <ExamQuestionPills questions={questions} answers={answers} textAnswers={textAnswers} activeIndex={activeIndex} onSelect={onSelect} />
      </Box>
    </Box>
  );
}
