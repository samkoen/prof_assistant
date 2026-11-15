import { Alert, Box, Button, Divider, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { ExamQuestionReadView } from "./ExamQuestionReadView";
import DisabledActionTooltip from "./DisabledActionTooltip";
import AnswerCheckPanel from "./exams/ai/AnswerCheckPanel";
import type { ParsedQuestion } from "../utils/qcmImportParser";
import type { GeminiAnswerCheck } from "../types/geminiQuestionSeries";
import {
  applyResolutions,
  canUseChecked,
  checkFor,
  pendingMismatches,
  summarizeChecks,
  type CheckResolution,
  type CheckResolutions,
} from "../utils/answerChecks";
import { contentDirFromFirstQuestion } from "../utils/examQuestionsLanguage";
import { hebrewActionsBarSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

interface GeminiGeneratedQuestionsPreviewProps {
  questions: ParsedQuestion[];
  accepting: boolean;
  editable: boolean;
  partial?: boolean;
  checks?: GeminiAnswerCheck[];
  resolutions?: CheckResolutions;
  onResolve?: (qNum: number, resolution: CheckResolution | undefined) => void;
  onAccept: () => void;
  onReject: () => void;
}

function previewDirection(questions: ParsedQuestion[]) {
  return contentDirFromFirstQuestion(
    questions.map((q, i) => ({
      text: q.text,
      order_index: i,
      options: q.options.map((o, j) => ({ text: o.text, order_index: j })),
    })),
  );
}

function ChecksSummary({ questions, checks }: { questions: ParsedQuestion[]; checks: GeminiAnswerCheck[] }) {
  if (checks.length === 0) return null;
  const s = summarizeChecks(questions, checks);
  return (
    <Alert severity={s.mismatch > 0 ? "warning" : "success"} sx={{ mb: 2 }}>
      <Typography variant="body2" fontWeight={700}>{he.answerCheckSummary(s.verified, s.mismatch, s.unchecked)}</Typography>
      <Typography variant="body2">{he.answerCheckSummaryHint}</Typography>
    </Alert>
  );
}

/** Aperçu des questions générées, avec le verdict de la double vérification sous chaque question. */
export default function GeminiGeneratedQuestionsPreview({
  questions,
  accepting,
  editable,
  partial = false,
  checks = [],
  resolutions = {},
  onResolve,
  onAccept,
  onReject,
}: GeminiGeneratedQuestionsPreviewProps) {
  const previewDir = previewDirection(questions);
  const shown = applyResolutions(questions, checks, resolutions);
  const pending = pendingMismatches(questions, checks, resolutions);
  const blockReason = !editable ? he.examNotEditable : pending.length > 0 ? he.answerCheckPendingReason(pending.length) : undefined;
  return (
    <Box sx={{ mt: 2 }} dir="rtl">
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {he.geminiPreviewTitle} ({questions.length})
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        {partial ? he.geminiPreviewPartialHint : he.geminiPreviewHint}
      </Alert>
      <ChecksSummary questions={questions} checks={checks} />
      {shown.map((q, i) => {
        const check = checkFor(questions[i], checks);
        return (
          <Box key={i} sx={{ mb: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
            <ExamQuestionReadView index={i + 1} text={q.text} questionType={q.question_type} points={q.points} options={q.options} contentDir={previewDir} />
            {check && (
              <AnswerCheckPanel
                check={check}
                canUseChecked={canUseChecked(questions[i], check)}
                resolution={resolutions[check.q_num]}
                onResolve={(r) => onResolve?.(check.q_num, r)}
              />
            )}
          </Box>
        );
      })}
      {!partial && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={hebrewActionsBarSx}>
            <Button variant="outlined" startIcon={<CloseIcon />} onClick={onReject} disabled={accepting}>
              {he.geminiRejectQuestions}
            </Button>
            <DisabledActionTooltip disabled={Boolean(blockReason) || accepting} disabledReason={blockReason}>
              <Button variant="contained" startIcon={<CheckIcon />} onClick={onAccept} disabled={accepting}>
                {accepting ? he.loading : he.geminiAcceptQuestions}
              </Button>
            </DisabledActionTooltip>
          </Box>
        </>
      )}
    </Box>
  );
}
