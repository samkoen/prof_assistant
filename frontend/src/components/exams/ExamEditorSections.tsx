import { Box } from "@mui/material";
import TaskStepsEditor from "./TaskStepsEditor";
import ExamEditorAddQuestionsSection from "../ExamEditorAddQuestionsSection";
import ExamEditorQuestionsSection from "../ExamEditorQuestionsSection";
import ExamEditorSettings from "./ExamEditorSettings";
import type { ExamDetail } from "../../api/client";
import type { ExamEditor } from "../../hooks/examEditor/useExamEditor";
import { he } from "../../i18n/he";
import type { EditorTab } from "../../utils/examEditorTab";
import { QCM_FORMAT_EXAMPLE, QCM_GEMINI_PROMPT } from "../../utils/qcmImportParser";

type ExamEditorSectionsProps = {
  editor: ExamEditor;
  exam: ExamDetail;
  examId: number;
  tab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
};

function AddQuestions({ editor, exam, examId, onTabChange }: ExamEditorSectionsProps) {
  const { importer, fb, data, dialog } = editor;
  const copyPrompt = async () => {
    await navigator.clipboard.writeText(QCM_GEMINI_PROMPT);
    fb.setSuccess(he.promptCopied);
  };
  const reloadAndShow = async () => {
    await data.load();
    onTabChange("questions");
  };
  return (
    <ExamEditorAddQuestionsSection
      examId={examId}
      exam={exam}
      onAddManual={dialog.openCreate}
      paste={importer.paste}
      onPasteChange={importer.setPaste}
      parseResult={importer.parseResult}
      importing={importer.importing}
      onCopyPrompt={copyPrompt}
      onLoadExample={() => importer.setPaste(QCM_FORMAT_EXAMPLE)}
      onImport={importer.importQuestions}
      onReload={reloadAndShow}
      onSuccess={fb.setSuccess}
      onError={fb.setError}
    />
  );
}

function Questions({ editor, exam, examId, onTabChange }: ExamEditorSectionsProps) {
  if (exam.kind === "task") return <TaskStepsEditor examId={examId} />;
  const { ops, dialog } = editor;
  return (
    <ExamEditorQuestionsSection
      exam={exam}
      reordering={ops.reordering}
      deletingQuestionId={ops.deletingQuestionId}
      onMove={ops.move}
      onEdit={dialog.openEdit}
      onDelete={ops.setQuestionToDelete}
      onAdd={() => onTabChange("add")}
    />
  );
}

function Settings({ editor, exam }: ExamEditorSectionsProps) {
  const { data, title, fb } = editor;
  return (
    <ExamEditorSettings
      exam={exam}
      titleDraft={data.titleDraft}
      titleChanged={title.titleChanged}
      titleValid={title.titleValid}
      savingTitle={title.savingTitle}
      onTitleChange={data.setTitleDraft}
      onSaveTitle={editor.saveTitleOnly}
      onExamUpdated={(patch) => data.setExam((prev) => (prev ? { ...prev, ...patch } : prev))}
      onError={fb.setError}
    />
  );
}

/** Contenu de l'onglet actif : questions, ajout de questions ou réglages. */
export default function ExamEditorSections(props: ExamEditorSectionsProps) {
  return (
    <Box dir="rtl" sx={{ minWidth: 0 }}>
      {props.tab === "questions" && <Questions {...props} />}
      {props.tab === "add" && <AddQuestions {...props} />}
      {props.tab === "settings" && <Settings {...props} />}
    </Box>
  );
}
