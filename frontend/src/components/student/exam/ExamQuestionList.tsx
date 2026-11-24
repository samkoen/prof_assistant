import { Fragment } from "react";
import type { ExamSection, StudentQuestion } from "../../../api/client";
import {
  effectiveRequired,
  groupAnsweredCount,
  groupMaxPoints,
  groupQuestionsBySection,
  lockedQuestionIds,
  type QuestionGroup,
} from "../../../utils/examSections";
import { examQuestionElementId, isQuestionAnswered } from "../../../utils/studentExamQuestionNav";
import ExamQuestionCard from "./ExamQuestionCard";
import ExamSectionHeader from "./ExamSectionHeader";

type ExamQuestionListProps = {
  questions: StudentQuestion[];
  sections?: ExamSection[];
  answers: Record<number, number[]>;
  textAnswers: Record<number, string>;
  practice: boolean;
  onSingle: (questionId: number, optionId: number) => void;
  onToggle: (questionId: number, optionId: number, checked: boolean) => void;
  onText: (questionId: number, value: string) => void;
  onClear: (questionId: number) => void;
};

type GroupProps = Omit<ExamQuestionListProps, "questions" | "sections"> & {
  group: QuestionGroup<StudentQuestion>;
  locked: Set<number>;
};

function QuestionGroupBlock({ group, locked, answers, textAnswers, practice, onSingle, onToggle, onText, onClear }: GroupProps) {
  const required = effectiveRequired(group.section, group.items.length);
  return (
    <>
      {group.section && (
        <ExamSectionHeader
          section={group.section}
          questionCount={group.items.length}
          required={required}
          points={groupMaxPoints(group)}
          answered={groupAnsweredCount(group, { answers, textAnswers })}
        />
      )}
      {group.items.map(({ question, index }) => (
        <ExamQuestionCard
          key={question.id}
          elementId={practice ? `practice-question-${index}` : examQuestionElementId(index)}
          index={index}
          question={question}
          selected={answers[question.id] ?? []}
          textValue={textAnswers[question.id] ?? ""}
          answered={isQuestionAnswered(question, answers, textAnswers)}
          locked={locked.has(question.id)}
          lockedHint={required ?? undefined}
          clearable={required != null}
          onSingle={onSingle}
          onToggle={onToggle}
          onText={onText}
          onClear={onClear}
        />
      ))}
    </>
  );
}

/** Cartes question regroupées par partie ; l'entraînement garde ses propres ids d'ancre (`practice-question-N`). */
export default function ExamQuestionList(props: ExamQuestionListProps) {
  const { questions, sections = [], ...rest } = props;
  const groups = groupQuestionsBySection(questions, sections);
  const locked = lockedQuestionIds(questions, sections, { answers: rest.answers, textAnswers: rest.textAnswers });
  return (
    <>
      {groups.map((group) => (
        <Fragment key={group.section?.id ?? "none"}>
          <QuestionGroupBlock group={group} locked={locked} {...rest} />
        </Fragment>
      ))}
    </>
  );
}
