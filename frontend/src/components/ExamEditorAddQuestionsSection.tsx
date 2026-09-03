import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
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
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import type { ExamDetail } from "../api/client";
import type { ParseResult } from "../utils/qcmImportParser";
import { he } from "../i18n/he";

export type QuestionAddMethod = "manual" | "gemini" | "paste";

const ADD_METHODS: QuestionAddMethod[] = ["manual", "gemini", "paste"];

type ExamEditorAddQuestionsSectionProps = {
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
  onReload: () => void | Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

function methodLabel(method: QuestionAddMethod): string {
  if (method === "manual") return he.addQuestionManual;
  if (method === "gemini") return he.addQuestionGemini;
  return he.addQuestionPaste;
}

function emptyMethodCards() {
  return [
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
}

function EmptyMethodCards({ onSelect }: { onSelect: (method: QuestionAddMethod) => void }) {
  return (
    <Box dir="rtl">
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {he.addQuestionEmptyTitle}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mt: 1 }}>
        {emptyMethodCards().map((c) => (
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
  onGeminiParseFailed: (rawText: string) => void;
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
  onGeminiParseFailed,
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
        onParseFailed={onGeminiParseFailed}
        onPasteChange={onPasteChange}
      />
    );
  }
  return (
    <ExamEditorImportSection
      examId={examId}
      exam={exam}
      paste={paste}
      onPasteChange={onPasteChange}
      parseResult={parseResult}
      importing={importing}
      onCopyPrompt={onCopyPrompt}
      onLoadExample={onLoadExample}
      onImport={onImport}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}

function toAddPanelProps(
  panel: ExamEditorAddQuestionsSectionProps,
  extras: Pick<AddPanelProps, "method" | "onGeminiParseFailed">,
): AddPanelProps {
  return {
    ...extras,
    examId: panel.examId,
    exam: panel.exam,
    onAddManual: panel.onAddManual,
    paste: panel.paste,
    onPasteChange: panel.onPasteChange,
    parseResult: panel.parseResult,
    importing: panel.importing,
    onCopyPrompt: panel.onCopyPrompt,
    onLoadExample: panel.onLoadExample,
    onImport: panel.onImport,
    onAfterImport: async () => {
      await panel.onReload();
    },
    onSuccess: panel.onSuccess,
    onError: panel.onError,
  };
}

function AddQuestionsWorkspace({
  addMethod,
  onMethodChange,
  onGeminiParseFailed,
  ...panel
}: ExamEditorAddQuestionsSectionProps & {
  addMethod: QuestionAddMethod;
  onMethodChange: (method: QuestionAddMethod) => void;
  onGeminiParseFailed: (rawText: string) => void;
}) {
  return (
    <Box dir="rtl" sx={hebrewAlignRightSx}>
      <AddMethodTabs method={addMethod} onMethodChange={onMethodChange} />
      <AddMethodPanel {...toAddPanelProps(panel, { method: addMethod, onGeminiParseFailed })} />
    </Box>
  );
}

export default function ExamEditorAddQuestionsSection(props: ExamEditorAddQuestionsSectionProps) {
  const hasQuestions = props.exam.questions.length > 0;
  const [addMethod, setAddMethod] = useState<QuestionAddMethod>("manual");
  const [emptyPicker, setEmptyPicker] = useState(!hasQuestions);

  useEffect(() => {
    setEmptyPicker(!hasQuestions);
  }, [hasQuestions]);

  if (emptyPicker) {
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
    <AddQuestionsWorkspace
      {...props}
      addMethod={addMethod}
      onMethodChange={setAddMethod}
      onGeminiParseFailed={(rawText) => {
        props.onPasteChange(rawText);
        props.onSuccess(he.geminiParseMovedToPaste);
      }}
    />
  );
}
