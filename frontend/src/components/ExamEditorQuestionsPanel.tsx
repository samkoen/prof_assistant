import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExamEditorGeminiGenerationSection from "./ExamEditorGeminiGenerationSection";
import ExamEditorImportSection from "./ExamEditorImportSection";
import ExamEditorQuestionsSection from "./ExamEditorQuestionsSection";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import type { ExamDetail, Question } from "../api/client";
import type { ParseResult } from "../utils/qcmImportParser";
import { he } from "../i18n/he";

export type QuestionAddMethod = "manual" | "gemini" | "paste";

const ADD_METHODS: QuestionAddMethod[] = ["manual", "gemini", "paste"];

type ExamEditorQuestionsPanelProps = {
  examId: number;
  exam: ExamDetail;
  reordering: boolean;
  deletingQuestionId: number | null;
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: (q: Question) => void;
  onDelete: (q: Question) => void;
  onAddManual: () => void;
  paste: string;
  onPasteChange: (value: string) => void;
  parseResult: ParseResult;
  importing: boolean;
  onCopyPrompt: () => void;
  onLoadExample: () => void;
  onImport: () => Promise<void>;
  onReload: () => void | Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

function methodLabel(method: QuestionAddMethod): string {
  if (method === "manual") return he.addQuestionManual;
  if (method === "gemini") return he.addQuestionGemini;
  return he.addQuestionPaste;
}

function EmptyMethodCards({ onSelect }: { onSelect: (method: QuestionAddMethod) => void }) {
  const cards = [
    {
      method: "manual" as const,
      icon: <EditOutlinedIcon fontSize="large" color="primary" />,
      title: he.addQuestionEmptyManual,
      desc: he.addQuestionManualHint,
    },
    {
      method: "gemini" as const,
      icon: <AutoAwesomeIcon fontSize="large" color="secondary" />,
      title: he.addQuestionEmptyGemini,
      desc: he.addQuestionEmptyGeminiDesc,
    },
    {
      method: "paste" as const,
      icon: <ContentPasteIcon fontSize="large" color="action" />,
      title: he.addQuestionEmptyPaste,
      desc: he.addQuestionEmptyPasteDesc,
    },
  ];
  return (
    <Box dir="rtl">
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {he.addQuestionEmptyTitle}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mt: 1 }}>
        {cards.map((c) => (
          <Card key={c.method} variant="outlined">
            <CardActionArea onClick={() => onSelect(c.method)} sx={{ height: "100%", p: 2 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Box mb={1}>{c.icon}</Box>
                <Typography fontWeight={600} gutterBottom>
                  {c.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {c.desc}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

function ManualAddPanel({ onAdd }: { onAdd: () => void }) {
  return (
    <Box dir="rtl" sx={{ py: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {he.addQuestionManualHint}
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
        {he.addQuestion}
      </Button>
    </Box>
  );
}

function AddMethodTabs({
  method,
  onMethodChange,
}: {
  method: QuestionAddMethod;
  onMethodChange: (method: QuestionAddMethod) => void;
}) {
  return (
    <Tabs
      value={method}
      onChange={(_, value) => onMethodChange(value as QuestionAddMethod)}
      variant="fullWidth"
      dir="rtl"
      sx={{ mb: 2, borderBottom: 1, borderColor: "divider", direction: "rtl" }}
    >
      {ADD_METHODS.map((m) => (
        <Tab key={m} value={m} label={methodLabel(m)} />
      ))}
    </Tabs>
  );
}

type AddPanelProps = {
  method: QuestionAddMethod;
  examId: number;
  exam: ExamDetail;
  onAddManual: () => void;
  paste: string;
  onPasteChange: (value: string) => void;
  parseResult: ParseResult;
  importing: boolean;
  onCopyPrompt: () => void;
  onLoadExample: () => void;
  onImport: () => Promise<void>;
  onAfterImport: () => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

function AddMethodPanel({
  method,
  examId,
  exam,
  onAddManual,
  paste,
  onPasteChange,
  parseResult,
  importing,
  onCopyPrompt,
  onLoadExample,
  onImport,
  onAfterImport,
  onSuccess,
  onError,
}: AddPanelProps) {
  if (method === "manual") return <ManualAddPanel onAdd={onAddManual} />;
  if (method === "gemini") {
    return (
      <ExamEditorGeminiGenerationSection
        examId={examId}
        exam={exam}
        onImported={onAfterImport}
        onSuccess={onSuccess}
        onError={onError}
      />
    );
  }
  return (
    <ExamEditorImportSection
      exam={exam}
      paste={paste}
      onPasteChange={onPasteChange}
      parseResult={parseResult}
      importing={importing}
      onCopyPrompt={onCopyPrompt}
      onLoadExample={onLoadExample}
      onImport={onImport}
    />
  );
}

export default function ExamEditorQuestionsPanel({
  examId,
  exam,
  reordering,
  deletingQuestionId,
  onMove,
  onEdit,
  onDelete,
  onAddManual,
  paste,
  onPasteChange,
  parseResult,
  importing,
  onCopyPrompt,
  onLoadExample,
  onImport,
  onReload,
  onSuccess,
  onError,
}: ExamEditorQuestionsPanelProps) {
  const hasQuestions = exam.questions.length > 0;
  const canEdit = exam.is_editable;
  const [addMethod, setAddMethod] = useState<QuestionAddMethod>("manual");
  const [emptyPicker, setEmptyPicker] = useState(!hasQuestions);

  useEffect(() => {
    if (hasQuestions) {
      setEmptyPicker(false);
      return;
    }
    if (canEdit) setEmptyPicker(true);
  }, [hasQuestions, canEdit]);

  const afterImport = async () => {
    await onReload();
  };

  const renderAddSection = () => (
    <Box dir="rtl" sx={hebrewAlignRightSx}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {he.addQuestionsSection}
      </Typography>
      <AddMethodTabs method={addMethod} onMethodChange={setAddMethod} />
      <AddMethodPanel
        method={addMethod}
        examId={examId}
        exam={exam}
        onAddManual={onAddManual}
        paste={paste}
        onPasteChange={onPasteChange}
        parseResult={parseResult}
        importing={importing}
        onCopyPrompt={onCopyPrompt}
        onLoadExample={onLoadExample}
        onImport={onImport}
        onAfterImport={afterImport}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Box>
  );

  if (!canEdit && !hasQuestions) {
    return (
      <Typography variant="body2" color="text.secondary" dir="rtl">
        {he.noQuestionsInExam}
      </Typography>
    );
  }

  if (!hasQuestions && emptyPicker) {
    return (
      <EmptyMethodCards
        onSelect={(method) => {
          setAddMethod(method);
          setEmptyPicker(false);
        }}
      />
    );
  }

  return (
    <Box>
      {hasQuestions && (
        <ExamEditorQuestionsSection
          exam={exam}
          reordering={reordering}
          deletingQuestionId={deletingQuestionId}
          onMove={onMove}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      {canEdit && (
        <>
          {hasQuestions && <Divider sx={{ my: 3 }} />}
          {renderAddSection()}
        </>
      )}
    </Box>
  );
}
