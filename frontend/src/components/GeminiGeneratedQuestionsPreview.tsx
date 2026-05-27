import { Alert, Box, Button, Divider, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { ExamQuestionReadView } from "./ExamQuestionReadView";
import DisabledActionTooltip from "./DisabledActionTooltip";
import type { ParsedQuestion } from "../utils/qcmImportParser";
import { hebrewActionsBarSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

interface GeminiGeneratedQuestionsPreviewProps {
  questions: ParsedQuestion[];
  accepting: boolean;
  editable: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export default function GeminiGeneratedQuestionsPreview({
  questions,
  accepting,
  editable,
  onAccept,
  onReject,
}: GeminiGeneratedQuestionsPreviewProps) {
  return (
    <Box sx={{ mt: 2 }} dir="rtl">
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {he.geminiPreviewTitle} ({questions.length})
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        {he.geminiPreviewHint}
      </Alert>
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
      <Box sx={hebrewActionsBarSx}>
        <Button variant="outlined" startIcon={<CloseIcon />} onClick={onReject} disabled={accepting}>
          {he.geminiRejectQuestions}
        </Button>
        <DisabledActionTooltip
          disabled={!editable || accepting}
          disabledReason={!editable ? he.examNotEditable : undefined}
        >
          <Button variant="contained" startIcon={<CheckIcon />} onClick={onAccept} disabled={accepting}>
            {accepting ? he.loading : he.geminiAcceptQuestions}
          </Button>
        </DisabledActionTooltip>
      </Box>
    </Box>
  );
}
