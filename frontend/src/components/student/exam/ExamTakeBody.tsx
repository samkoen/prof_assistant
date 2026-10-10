import { Button } from "@mui/material";
import type { ExamTakeState } from "../../../hooks/examTake/useExamTake";
import { he } from "../../../i18n/he";
import { scrollToExamQuestion } from "../../../utils/studentExamQuestionNav";
import { unansweredCount } from "../../../utils/examTake";
import ExamQuestionList from "./ExamQuestionList";
import ExamResultView from "./ExamResultView";
import ExamSubmitBar from "./ExamSubmitBar";
import ExamTopBar from "./ExamTopBar";

function PracticeBody({ state }: { state: ExamTakeState }) {
  const { paper } = state.loader;
  const { store, actions } = state;
  return (
    <>
      <ExamQuestionList
        questions={paper?.questions ?? []}
        answers={store.answers}
        textAnswers={store.textAnswers}
        practice
        onSingle={store.setSingle}
        onToggle={store.toggleMultiple}
        onText={store.setOpenText}
      />
      <Button variant="contained" size="large" sx={{ mt: 2 }} disabled={actions.submitting} onClick={() => actions.submitPractice()}>
        {actions.submitting ? he.loading : he.submitPracticeExam}
      </Button>
    </>
  );
}

function OfficialBody({ state }: { state: ExamTakeState }) {
  const { paper, autoSubmitted } = state.loader;
  const { store, actions, timer } = state;
  const questions = paper?.questions ?? [];
  return (
    <>
      {state.showNav && paper && (
        <ExamTopBar
          title={paper.exam_title}
          isTirgoul={Boolean(paper.is_tirgoul)}
          timer={timer}
          questions={questions}
          answers={store.answers}
          textAnswers={store.textAnswers}
          activeIndex={state.activeIndex}
          allAnswered={state.allAnswered}
          onSelect={scrollToExamQuestion}
          onNextUnanswered={state.goNextUnanswered}
        />
      )}
      <ExamQuestionList
        questions={questions}
        answers={store.answers}
        textAnswers={store.textAnswers}
        practice={false}
        onSingle={store.setSingle}
        onToggle={store.toggleMultiple}
        onText={store.setOpenText}
      />
      <ExamSubmitBar
        unanswered={unansweredCount(questions.length, state.answeredCount)}
        submitting={actions.submitting}
        autoSubmitted={autoSubmitted}
        onSubmit={() => actions.submit()}
      />
    </>
  );
}

/** Corps de la page selon la phase : résultat, entraînement ou examen officiel. */
export default function ExamTakeBody({ state, id }: { state: ExamTakeState; id: number }) {
  if (state.submitted) return <ExamResultView state={state} id={id} />;
  if (state.rulesPending) return null;
  if (state.loader.phase === "practice") return <PracticeBody state={state} />;
  return <OfficialBody state={state} />;
}
