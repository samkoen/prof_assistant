import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert, Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExamContextActionsBar from "../../components/ExamContextActionsBar";
import QuestionEditDialog from "../../components/QuestionEditDialog";
import DeleteQuestionDialog from "../../components/exams/DeleteQuestionDialog";
import ExamEditorSaveBar from "../../components/exams/ExamEditorSaveBar";
import ExamEditorSections from "../../components/exams/ExamEditorSections";
import ExamEditorTabs from "../../components/exams/ExamEditorTabs";
import BrandPageLoader from "../../components/ui/BrandPageLoader";
import { useEditorTab } from "../../hooks/examEditor/useEditorTab";
import PageHeroBanner from "../../components/ui/PageHeroBanner";
import { useExamEditor } from "../../hooks/examEditor/useExamEditor";
import { he } from "../../i18n/he";
import { mergeSavedQuestion } from "../../utils/examEditorChanges";
import { parseOfferingIdFromReturn } from "../../utils/examOfferingActionRules";

/** Éditeur d'examen : barre d'enregistrement fixe, sections repliables, dialogues de question. */
export default function TeacherExamEditorPage() {
  const id = Number(useParams<{ examId: string }>().examId);
  const returnTo = useSearchParams()[0].get("return") || "/teacher/exams";
  const navigate = useNavigate();
  const offeringId = parseOfferingIdFromReturn(returnTo);
  const editor = useExamEditor(id, offeringId);
  const { fb, data, title, changes, ops, dialog } = editor;
  const exam = data.exam;
  const { tab, setTab } = useEditorTab(exam?.question_count ?? 0, exam?.is_editable ?? false);

  if (data.loading && !exam) return <BrandPageLoader />;
  if (!exam) return <Alert severity="error">{fb.error || he.errorGeneric}</Alert>;
  const backLabel = returnTo.includes("/exams") ? he.backToExams : he.backToCourses;

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }} dir="rtl">
      <Button component={RouterLink} to={returnTo} startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1 }}>
        {backLabel}
      </Button>
      <PageHeroBanner title={he.editExam} subtitle={[exam.catalog_course_name, exam.title].filter(Boolean).join(" — ")} />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
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
      </Box>
      <ExamEditorSaveBar
        hasChanges={changes.hasChanges}
        titleValid={title.titleValid}
        saving={title.savingTitle}
        discarding={changes.discarding}
        questionCount={exam.question_count}
        onDiscard={changes.discard}
        onSave={changes.save}
      />
      {fb.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => fb.setError("")}>{fb.error}</Alert>}
      {fb.success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => fb.setSuccess("")}>{fb.success}</Alert>}
      <ExamEditorTabs value={tab} questionCount={exam.question_count} canAdd={exam.is_editable} onChange={setTab} />
      <ExamEditorSections editor={editor} exam={exam} examId={id} tab={tab} onTabChange={setTab} />
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
