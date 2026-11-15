import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert, Box } from "@mui/material";
import ExamContextActionsBar from "../../components/ExamContextActionsBar";
import QuestionEditDialog from "../../components/QuestionEditDialog";
import DeleteQuestionDialog from "../../components/exams/DeleteQuestionDialog";
import ExamEditorSaveBar from "../../components/exams/ExamEditorSaveBar";
import ExamEditorSections from "../../components/exams/ExamEditorSections";
import ExamEditorTabs from "../../components/exams/ExamEditorTabs";
import AppPageHeader from "../../components/ui/AppPageHeader";
import BrandPageLoader from "../../components/ui/BrandPageLoader";
import StatusChip from "../../components/ui/StatusChip";
import type { ExamDetail } from "../../api/client";
import { useEditorTab } from "../../hooks/examEditor/useEditorTab";
import { useExamEditor } from "../../hooks/examEditor/useExamEditor";
import { he } from "../../i18n/he";
import { mergeSavedQuestion } from "../../utils/examEditorChanges";
import { parseOfferingIdFromReturn } from "../../utils/examOfferingActionRules";

function kindLabel(exam: ExamDetail): string {
  if (exam.kind === "task") return he.createExamTypeTask;
  if (exam.is_tirgoul || exam.kind === "tirgoul") return he.createExamTypePractice;
  return he.createExamTypeExam;
}

function EditorMeta({ exam }: { exam: ExamDetail }) {
  const count = exam.question_count;
  return (
    <>
      <StatusChip label={kindLabel(exam)} tone="primary" />
      <StatusChip label={count > 0 ? he.examsQuestionsLabel(count) : he.examQuestionsEmptyBadge} tone={count > 0 ? "neutral" : "warning"} />
      {!exam.is_editable && <StatusChip label={he.examNotEditable} tone="warning" />}
    </>
  );
}

function backLabelFor(returnTo: string): string {
  return returnTo.includes("/exams") ? he.backToExams : he.backToCourses;
}

/** Éditeur de מטלה : en-tête compact (titre, type, action principale), onglets, barre d'enregistrement flottante. */
export default function TeacherExamEditorPage() {
  const id = Number(useParams<{ examId: string }>().examId);
  const returnTo = useSearchParams()[0].get("return") || "/teacher/exams";
  const navigate = useNavigate();
  const offeringId = parseOfferingIdFromReturn(returnTo);
  const editor = useExamEditor(id, offeringId);
  const { fb, data, title, changes, ops, dialog } = editor;
  const exam = data.exam;
  const task = exam?.kind === "task";
  const { tab, setTab } = useEditorTab(task ? 1 : exam?.question_count ?? 0, task ? false : exam?.is_editable ?? false);

  if (data.loading && !exam) return <BrandPageLoader />;
  if (!exam) return <Alert severity="error">{fb.error || he.errorGeneric}</Alert>;

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }} dir="rtl">
      <AppPageHeader
        size="medium"
        back={{ to: returnTo, label: backLabelFor(returnTo) }}
        title={exam.title || he.newExamDefaultTitle}
        subtitle={exam.catalog_course_name}
        meta={<EditorMeta exam={exam} />}
        actions={
          <ExamContextActionsBar
            exam={exam}
            session={data.session}
            courseId={offeringId ?? undefined}
            returnTo={returnTo}
            hasQuestions={exam.question_count > 0}
            compactMenu={false}
            onChanged={data.refreshContext}
            onError={fb.setError}
            onSuccess={fb.setSuccess}
            onDeleted={() => navigate(returnTo)}
          />
        }
      />
      {fb.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => fb.setError("")}>{fb.error}</Alert>}
      {fb.success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => fb.setSuccess("")}>{fb.success}</Alert>}
      <ExamEditorTabs value={tab} questionCount={exam.question_count} canAdd={!task && exam.is_editable} stepsMode={task} onChange={setTab} />
      <ExamEditorSections editor={editor} exam={exam} examId={id} tab={tab} onTabChange={setTab} />
      {changes.hasChanges && <Box aria-hidden sx={{ height: 88 }} />}
      <ExamEditorSaveBar
        hasChanges={changes.hasChanges}
        titleValid={title.titleValid}
        saving={title.savingTitle}
        discarding={changes.discarding}
        questionCount={exam.question_count}
        onDiscard={changes.discard}
        onSave={changes.save}
      />
      <QuestionEditDialog
        examId={id}
        question={dialog.question}
        open={dialog.open}
        onClose={dialog.close}
        onSaved={(created, saved) => {
          fb.setSuccess(created ? he.questionAdded : he.questionSaved);
          if (created) setTab("questions");
          data.syncQuestions((questions) => mergeSavedQuestion(questions, saved, created));
        }}
      />
      <DeleteQuestionDialog
        question={ops.questionToDelete}
        deleting={ops.deletingQuestionId != null}
        onClose={() => ops.setQuestionToDelete(null)}
        onConfirm={ops.remove}
      />
    </Box>
  );
}
