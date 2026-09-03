import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Typography,
} from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import UploadIcon from "@mui/icons-material/Upload";
import DirectionalMultilineField from "./DirectionalMultilineField";
import { ExamQuestionReadView } from "./ExamQuestionReadView";
import DisabledActionTooltip from "./DisabledActionTooltip";
import QcmParseFailureAlert from "./QcmParseFailureAlert";
import type { ExamDetail } from "../api/client";
import { QCM_FORMAT_EXAMPLE, type ParsedQuestion, type ParseResult } from "../utils/qcmImportParser";
import { canImportValidQuestions } from "../utils/qcmPartialImport";
import { contentDirFromFirstQuestion } from "../utils/examQuestionsLanguage";
import PasteGeminiRefineSection from "./PasteGeminiRefineSection";
import { hebrewActionsBarRtlSx, hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";
import { isDevEnvironment } from "../utils/isDevEnvironment";

interface ExamEditorImportSectionProps {
  examId: number;
  exam: ExamDetail;
  paste: string;
  onPasteChange: (value: string) => void;
  parseResult: ParseResult;
  importing: boolean;
  onCopyPrompt: () => void;
  onLoadExample: () => void;
  onImport: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function ExamEditorImportSection({
  examId,
  exam,
  paste,
  onPasteChange,
  parseResult,
  importing,
  onCopyPrompt,
  onLoadExample,
  onImport,
  onSuccess,
  onError,
}: ExamEditorImportSectionProps) {
  const [autoFixing, setAutoFixing] = useState(false);
  const showFailure = parseResult.errors.length > 0 && !autoFixing;
  const showPreview = canImportValidQuestions(parseResult) && !autoFixing;
  return (
    <Box dir="rtl" sx={hebrewAlignRightSx}>
      <Box display="flex" alignItems="flex-start" gap={1} mb={1} flexDirection="row-reverse">
        <ContentPasteIcon color="primary" sx={{ mt: 0.25 }} />
        <Typography variant="body2" color="text.secondary">
          {he.pasteQcmHintIntro}
        </Typography>
      </Box>
      <PasteHints />
      {isDevEnvironment && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {he.pasteQcmHintCrossEnv}
        </Typography>
      )}
      <Box sx={{ ...hebrewActionsBarRtlSx, mb: 2 }}>
        <Button size="small" variant="outlined" onClick={onCopyPrompt}>
          {he.copyGeminiPrompt}
        </Button>
        <Button size="small" variant="text" onClick={onLoadExample}>
          {he.loadExample}
        </Button>
      </Box>
      <DisabledActionTooltip
        disabled={!exam.is_editable}
        disabledReason={!exam.is_editable ? he.examNotEditable : undefined}
      >
        <DirectionalMultilineField
          variant="mixed"
          value={paste}
          onChange={onPasteChange}
          placeholder={QCM_FORMAT_EXAMPLE}
          minRows={12}
          maxRows={24}
          showHint
          sx={{ mb: 2, "& textarea": { fontFamily: "monospace" } }}
        />
      </DisabledActionTooltip>
      {parseResult.errors.length > 0 && (
        <PasteGeminiRefineSection
          examId={examId}
          errors={parseResult.errors}
          editable={exam.is_editable}
          pasteText={paste}
          onRawText={onPasteChange}
          onError={onError}
          onSuccess={onSuccess}
          onBusyChange={setAutoFixing}
        />
      )}
      {showFailure && (
        <QcmParseFailureAlert
          errors={parseResult.errors}
          validCount={parseResult.questions.length}
          hint={he.geminiParseFailedHintPaste}
          editable={exam.is_editable}
          importing={importing}
          onImportValid={onImport}
        />
      )}
      {showPreview && parseResult.errors.length === 0 && (
        <ImportPreview questions={parseResult.questions} exam={exam} importing={importing} onImport={onImport} />
      )}
    </Box>
  );
}

function PasteHints() {
  return (
    <Box sx={{ mb: 2 }}>
      <Box component="ul" sx={{ m: 0, paddingInlineStart: 2.5, color: "text.secondary" }}>
        <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
          {he.pasteQcmHintRule1}
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
          {he.pasteQcmHintRule2}
        </Typography>
        <Typography component="li" variant="body2">
          {he.pasteQcmHintRule3}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
        {he.pasteQcmHintFormatLabel}
      </Typography>
      <Typography
        variant="caption"
        component="div"
        dir="ltr"
        sx={{
          mt: 1.5,
          px: 1.5,
          py: 0.75,
          bgcolor: "action.hover",
          borderRadius: 1,
          fontFamily: "monospace",
          textAlign: "left",
          color: "text.secondary",
        }}
      >
        {he.pasteQcmHintFormatExample}
      </Typography>
    </Box>
  );
}

function ImportPreview({
  questions,
  exam,
  importing,
  onImport,
}: {
  questions: ParsedQuestion[];
  exam: ExamDetail;
  importing: boolean;
  onImport: () => void;
}) {
  const previewDir = contentDirFromFirstQuestion(
    questions.map((q, i) => ({
      text: q.text,
      order_index: i,
      options: q.options.map((o, j) => ({ text: o.text, order_index: j })),
    })),
  );
  return (
    <>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ textAlign: "start" }}>
        {he.importPreview} ({questions.length})
      </Typography>
      {questions.map((q, i) => (
        <Box key={i} sx={{ mb: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
          <ExamQuestionReadView
            index={i + 1}
            text={q.text}
            questionType={q.question_type}
            points={q.points}
            options={q.options}
            contentDir={previewDir}
          />
        </Box>
      ))}
      <Divider sx={{ my: 2 }} />
      <Box sx={hebrewActionsBarRtlSx}>
        <DisabledActionTooltip
          disabled={!exam.is_editable || importing}
          disabledReason={!exam.is_editable ? he.examNotEditable : undefined}
        >
          <Button variant="contained" startIcon={<UploadIcon />} onClick={onImport}>
            {importing ? he.loading : he.importQuestions}
          </Button>
        </DisabledActionTooltip>
      </Box>
    </>
  );
}
