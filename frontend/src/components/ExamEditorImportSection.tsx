import {
  Alert,
  Box,
  Button,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import UploadIcon from "@mui/icons-material/Upload";
import { ExamQuestionReadView } from "./ExamQuestionReadView";
import DisabledActionTooltip from "./DisabledActionTooltip";
import type { ExamDetail } from "../api/client";
import { QCM_FORMAT_EXAMPLE, type ParsedQuestion, type ParseResult } from "../utils/qcmImportParser";
import { he } from "../i18n/he";

interface ExamEditorImportSectionProps {
  exam: ExamDetail;
  paste: string;
  onPasteChange: (value: string) => void;
  parseResult: ParseResult;
  importing: boolean;
  onCopyPrompt: () => void;
  onLoadExample: () => void;
  onImport: () => void;
}

export default function ExamEditorImportSection({
  exam,
  paste,
  onPasteChange,
  parseResult,
  importing,
  onCopyPrompt,
  onLoadExample,
  onImport,
}: ExamEditorImportSectionProps) {
  return (
    <>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <ContentPasteIcon color="primary" />
        <Typography variant="body2" color="text.secondary">
          {he.pasteQcmHintIntro}
        </Typography>
      </Box>
      <PasteHints />
      <Button size="small" variant="outlined" onClick={onCopyPrompt} sx={{ mb: 1, mr: 1 }}>
        {he.copyGeminiPrompt}
      </Button>
      <Button size="small" variant="text" onClick={onLoadExample} sx={{ mb: 2 }}>
        {he.loadExample}
      </Button>
      <DisabledActionTooltip
        disabled={!exam.is_editable}
        disabledReason={!exam.is_editable ? he.examNotEditable : undefined}
      >
        <TextField
          multiline
          minRows={12}
          fullWidth
          value={paste}
          onChange={(e) => onPasteChange(e.target.value)}
          placeholder={QCM_FORMAT_EXAMPLE}
          dir="rtl"
          sx={{ fontFamily: "monospace", mb: 2 }}
        />
      </DisabledActionTooltip>
      {parseResult.errors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {parseResult.errors.map((e) => (
            <Typography key={e.block} variant="body2">
              {he.questionBlock} {e.block}: {e.message}
            </Typography>
          ))}
        </Alert>
      )}
      {parseResult.questions.length > 0 && parseResult.errors.length === 0 && (
        <ImportPreview questions={parseResult.questions} exam={exam} importing={importing} onImport={onImport} />
      )}
    </>
  );
}

function PasteHints() {
  return (
    <Box sx={{ mb: 2 }} dir="rtl">
      <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
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
  return (
    <>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
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
            contentDir="ltr"
          />
        </Box>
      ))}
      <Divider sx={{ my: 2 }} />
      <DisabledActionTooltip
        disabled={!exam.is_editable || importing}
        disabledReason={!exam.is_editable ? he.examNotEditable : undefined}
      >
        <Button variant="contained" startIcon={<UploadIcon />} onClick={onImport}>
          {importing ? he.loading : he.importQuestions}
        </Button>
      </DisabledActionTooltip>
    </>
  );
}
