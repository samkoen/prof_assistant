import ExamContextActionsBar from "./ExamContextActionsBar";
import type { Exam, ExamSession } from "../api/client";

type ExamOfferingRowActionsProps = {
  exam: Exam;
  session?: ExamSession;
  courseId: number;
  hasQuestions: boolean;
  returnTo: string;
  onChanged: () => void | Promise<void>;
  onError: (message: string) => void;
  onSuccess?: (message: string) => void;
  onReopened?: () => void;
};

export default function ExamOfferingRowActions({
  exam,
  session,
  courseId,
  hasQuestions,
  returnTo,
  onChanged,
  onError,
  onSuccess,
  onReopened,
}: ExamOfferingRowActionsProps) {
  return (
    <ExamContextActionsBar
      exam={exam}
      session={session}
      courseId={courseId}
      returnTo={returnTo}
      hasQuestions={hasQuestions}
      showEditLink
      onChanged={onChanged}
      onError={onError}
      onSuccess={onSuccess}
      onReopened={onReopened}
    />
  );
}
