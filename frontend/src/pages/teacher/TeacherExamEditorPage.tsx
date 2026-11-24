import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Typography } from "@mui/material";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import ExamContextActionsBar from "../../components/ExamContextActionsBar";
import QuestionEditDialog from "../../components/QuestionEditDialog";
import DeleteQuestionDialog from "../../components/exams/DeleteQuestionDialog";
import ExamEditorSections from "../../components/exams/ExamEditorSections";
import ExamEditorSettings from "../../components/exams/ExamEditorSettings";
import InlineExamTitle from "../../components/exams/InlineExamTitle";
import AppPageHeader from "../../components/ui/AppPageHeader";
import BrandPageLoader from "../../components/ui/BrandPageLoader";
import StatusChip from "../../components/ui/StatusChip";
import type { ExamDetail } from "../../api/client";
import { useExamEditor, type ExamEditor } from "../../hooks/examEditor/useExamEditor";
import { he } from "../../i18n/he";
import { mergeSavedQuestion } from "../../utils/examEditorChanges";
import { parseOfferingIdFromReturn } from "../../utils/examOfferingActionRules";
import { parseStartMethod, START_PARAM } from "../../utils/examStartMethod";

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
      {exam.kind !== "task" && (
        <StatusChip label={count > 0 ? he.examsQuestionsLabel(count) : he.examQuestionsEmptyBadge} tone={count > 0 ? "neutral" : "warning"} />
      )}
      {!exam.is_editable && <StatusChip label={he.examNotEditable} tone="warning" />}
      {exam.is_editable && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
          <CloudDoneOutlinedIcon sx={{ fontSize: 16 }} />
          {he.examAutoSaved}
        </Typography>
      )}
    </>
  );
}

function backLabelFor(returnTo: string): string {
  return returnTo.includes("/exams") ? he.backToExams : he.backToCourses;
}

function useEditorRoute() {
  const id = Number(useParams<{ examId: string }>().examId);
  const [search] = useSearchParams();
  const returnTo = search.get("return") || "/teacher/exams";
  return { id, returnTo, offeringId: parseOfferingIdFromReturn(returnTo), startMethod: parseStartMethod(search.get(START_PARAM)) };
}

function EditorDialogs({ editor, examId }: { editor: ExamEditor; examId: number }) {
  const { fb, data, ops, dialog } = editor;
  return (
    <>
      <QuestionEditDialog
        examId={examId}
        sections={data.exam?.sections ?? []}
        question={dialog.question}
        open={dialog.open}
        onClose={dialog.close}
        onSaved={(created, saved) => {
          fb.setSuccess(created ? he.questionAdded : he.questionSaved);
          data.syncQuestions((questions) => mergeSavedQuestion(questions, saved, created));
        }}
      />
      <DeleteQuestionDialog
        question={ops.questionToDelete}
        deleting={ops.deletingQuestionId != null}
        onClose={() => ops.setQuestionToDelete(null)}
        onConfirm={ops.remove}
      />
    </>
  );
}

type EditorRoute = ReturnType<typeof useEditorRoute>;

function EditorHeader({ editor, exam, route, onOpenSettings }: { editor: ExamEditor; exam: ExamDetail; route: EditorRoute; onOpenSettings: () => void }) {
  const navigate = useNavigate();
  const { fb, data, title } = editor;
  return (
      <AppPageHeader
        size="medium"
        back={{ to: route.returnTo, label: backLabelFor(route.returnTo) }}
        title={
          <InlineExamTitle
            value={data.titleDraft}
            editable={exam.is_editable}
            saving={title.savingTitle}
            onChange={data.setTitleDraft}
            onCommit={title.commitTitle}
            onCancel={title.cancelTitle}
          />
        }
        subtitle={exam.catalog_course_name}
        meta={<EditorMeta exam={exam} />}
        actions={
          <>
            <Button variant="outlined" startIcon={<TuneIcon />} onClick={onOpenSettings}>
              {he.examSettingsOpen}
            </Button>
            <ExamContextActionsBar
              exam={exam}
              session={data.session}
              courseId={route.offeringId ?? undefined}
              returnTo={route.returnTo}
              hasQuestions={exam.question_count > 0}
              compactMenu={false}
              onChanged={data.refreshContext}
              onError={fb.setError}
              onSuccess={fb.setSuccess}
              onDeleted={() => navigate(route.returnTo)}
            />
          </>
        }
      />
  );
}

/**
 * Éditeur sur une seule page : titre modifiable dans l'en-tête, questions puis ajout en place,
 * réglages dans un panneau latéral. Tout est enregistré automatiquement.
 */
export default function TeacherExamEditorPage() {
  const route = useEditorRoute();
  const editor = useExamEditor(route.id, route.offeringId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { fb, data } = editor;
  const exam = data.exam;

  if (data.loading && !exam) return <BrandPageLoader />;
  if (!exam) return <Alert severity="error">{fb.error || he.errorGeneric}</Alert>;

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }} dir="rtl">
      <EditorHeader editor={editor} exam={exam} route={route} onOpenSettings={() => setSettingsOpen(true)} />
      {fb.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => fb.setError("")}>{fb.error}</Alert>}
      {fb.success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => fb.setSuccess("")}>{fb.success}</Alert>}
      <ExamEditorSections editor={editor} exam={exam} examId={route.id} startMethod={route.startMethod} />
      <ExamEditorSettings
        open={settingsOpen}
        exam={exam}
        onClose={() => setSettingsOpen(false)}
        onExamUpdated={(patch) => data.setExam((prev) => (prev ? { ...prev, ...patch } : prev))}
        onError={fb.setError}
      />
      <EditorDialogs editor={editor} examId={route.id} />
    </Box>
  );
}
