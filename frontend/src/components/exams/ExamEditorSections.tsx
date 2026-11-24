import { useState } from "react";
import { Box, Button, Card, Collapse, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ExamStructurePanel from "./ExamStructurePanel";
import TaskStepsEditor from "./TaskStepsEditor";
import ExamEditorAddQuestionsSection from "../ExamEditorAddQuestionsSection";
import ExamEditorQuestionsSection from "../ExamEditorQuestionsSection";
import type { ExamDetail } from "../../api/client";
import type { ExamEditor } from "../../hooks/examEditor/useExamEditor";
import { he } from "../../i18n/he";
import { addPanelOpenInitially, type QuestionAddMethod } from "../../utils/examStartMethod";
import { QCM_FORMAT_EXAMPLE, QCM_GEMINI_PROMPT } from "../../utils/qcmImportParser";

type ExamEditorSectionsProps = {
  editor: ExamEditor;
  exam: ExamDetail;
  examId: number;
  startMethod: QuestionAddMethod | null;
};

function AddQuestions({ editor, exam, examId, startMethod }: ExamEditorSectionsProps) {
  const { importer, fb, data, dialog } = editor;
  const copyPrompt = async () => {
    await navigator.clipboard.writeText(QCM_GEMINI_PROMPT);
    fb.setSuccess(he.promptCopied);
  };
  return (
    <ExamEditorAddQuestionsSection
      examId={examId}
      exam={exam}
      initialMethod={startMethod}
      onAddManual={dialog.openCreate}
      paste={importer.paste}
      onPasteChange={importer.setPaste}
      parseResult={importer.parseResult}
      importing={importer.importing}
      onCopyPrompt={copyPrompt}
      onLoadExample={() => importer.setPaste(QCM_FORMAT_EXAMPLE)}
      onImport={importer.importQuestions}
      onReload={data.load}
      onSuccess={fb.setSuccess}
      onError={fb.setError}
    />
  );
}

/** Bloc d'ajout sous la liste : ouvert d'emblée pour un examen vide, repliable ensuite. */
function AddPanel(props: ExamEditorSectionsProps & { open: boolean; onToggle: (open: boolean) => void }) {
  const { open, onToggle, exam } = props;
  return (
    <Card id="exam-add-questions" variant="outlined" sx={{ mt: 1, p: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="h6" component="h2">{he.addQuestionsMore}</Typography>
        {open && exam.questions.length > 0 && (
          <Button size="small" startIcon={<CloseIcon />} onClick={() => onToggle(false)}>{he.addQuestionsClose}</Button>
        )}
        {!open && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => onToggle(true)}>{he.addQuestionsSection}</Button>
        )}
      </Box>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ mt: 2 }}>
          <AddQuestions {...props} />
        </Box>
      </Collapse>
    </Card>
  );
}

function openAddPanel(setOpen: (open: boolean) => void) {
  setOpen(true);
  requestAnimationFrame(() => document.getElementById("exam-add-questions")?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

/** Contenu de l'éditeur sur une seule page : questions, puis ajout en place (pas d'onglet séparé). */
export default function ExamEditorSections(props: ExamEditorSectionsProps) {
  const { editor, exam, examId, startMethod } = props;
  const [addOpen, setAddOpen] = useState(() => addPanelOpenInitially(exam.questions.length, exam.is_editable, startMethod));
  if (exam.kind === "task") return <TaskStepsEditor examId={examId} />;
  const { ops, dialog, structure } = editor;
  return (
    <Box dir="rtl" sx={{ minWidth: 0 }}>
      <ExamStructurePanel exam={exam} structure={structure} />
      {exam.questions.length > 0 && (
        <ExamEditorQuestionsSection
          exam={exam}
          reordering={ops.reordering}
          deletingQuestionId={ops.deletingQuestionId}
          onMove={ops.move}
          onEdit={dialog.openEdit}
          onDelete={ops.setQuestionToDelete}
          onAssign={(questionId, sectionId) => structure.assign([questionId], sectionId)}
          onAdd={addOpen ? undefined : () => openAddPanel(setAddOpen)}
        />
      )}
      {exam.is_editable && <AddPanel {...props} open={addOpen} onToggle={setAddOpen} />}
      {!exam.is_editable && exam.questions.length === 0 && (
        <Typography variant="body2" color="text.secondary">{he.noQuestionsInExam}</Typography>
      )}
    </Box>
  );
}
