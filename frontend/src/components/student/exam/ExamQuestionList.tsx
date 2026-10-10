import type { StudentQuestion } from "../../../api/client";
import { examQuestionElementId, isQuestionAnswered } from "../../../utils/studentExamQuestionNav";
import ExamQuestionCard from "./ExamQuestionCard";

type ExamQuestionListProps = {
  questions: StudentQuestion[];
  answers: Record<number, number[]>;
  textAnswers: Record<number, string>;
  practice: boolean;
  onSingle: (questionId: number, optionId: number) => void;
  onToggle: (questionId: number, optionId: number, checked: boolean) => void;
  onText: (questionId: number, value: string) => void;
};

/** Liste des cartes question ; l'entraînement garde ses propres ids d'ancre (`practice-question-N`). */
export default function ExamQuestionList(props: ExamQuestionListProps) {
  const { questions, answers, textAnswers, practice, onSingle, onToggle, onText } = props;
  return (
    <>
      {questions.map((q, i) => (
        <ExamQuestionCard
          key={q.id}
          elementId={practice ? `practice-question-${i + 1}` : examQuestionElementId(i + 1)}
          index={i + 1}
          question={q}
          selected={answers[q.id] ?? []}
          textValue={textAnswers[q.id] ?? ""}
          answered={isQuestionAnswered(q, answers, textAnswers)}
          onSingle={onSingle}
          onToggle={onToggle}
          onText={onText}
        />
      ))}
    </>
  );
}
