import { Link as RouterLink } from "react-router-dom";
import { Box, Button } from "@mui/material";
import type { ExamTakeState } from "../../../hooks/examTake/useExamTake";
import { he } from "../../../i18n/he";
import { studentCourseExamsPath } from "../../../utils/studentCourseExamsNav";
import TaskResultPanel from "./TaskResultPanel";
import ExamSubmissionReview from "../../ExamSubmissionReview";
import ExamResultHeader from "./ExamResultHeader";

function updateScore(state: ExamTakeState) {
  const { phase, setAttempt } = state.loader;
  return (score: number | null, maxScore: number | null) =>
    setAttempt((prev) =>
      prev
        ? { ...prev, ...(phase === "practice_review" ? { practice_score: score, practice_max_score: maxScore } : { score, max_score: maxScore }) }
        : prev,
    );
}

function ResultActions({ state, id }: { state: ExamTakeState; id: number }) {
  const { paper, phase } = state.loader;
  const { startingPractice, startPractice } = state.actions;
  if (!paper) return null;
  const task = paper.kind === "task";
  const again = !task && paper.is_tirgoul && (phase === "final" || phase === "practice_review");
  const practice = !task && !paper.is_tirgoul && (phase === "final" || phase === "practice_review");
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
      {again && (
        <Button variant="contained" color="success" disabled={startingPractice} onClick={startPractice}>
          {startingPractice ? he.loading : he.retryTirgoul}
        </Button>
      )}
      {practice && (
        <Button variant="contained" color="success" disabled={startingPractice} onClick={startPractice}>
          {startingPractice ? he.loading : he.startPracticeExam}
        </Button>
      )}
      <Button component={RouterLink} to={studentCourseExamsPath(paper.offering_id, id)} variant="outlined">
        {he.backToCourseExams}
      </Button>
    </Box>
  );
}

/** Écran de fin : score, correction détaillée et actions (nouvel essai, entraînement, retour). */
export default function ExamResultView({ state, id }: { state: ExamTakeState; id: number }) {
  const { paper, attempt, review, practiceResults, phase } = state.loader;
  if (!paper) return null;
  const published = Boolean(paper.is_tirgoul || (review?.results_published ?? paper.results_published));
  return (
    <>
      {attempt && (
        <ExamResultHeader
          attempt={attempt}
          practiceResults={practiceResults}
          resultsPublished={published}
          practiceReview={phase === "practice_review"}
        />
      )}
      {paper.kind === "task" ? <TaskResultPanel sessionId={paper.session_id} /> : review && <ExamSubmissionReview review={review} onAttemptScore={updateScore(state)} />}
      <ResultActions state={state} id={id} />
    </>
  );
}
