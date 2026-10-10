import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { he } from "../../../i18n/he";
import ConfirmDialog from "../../ui/ConfirmDialog";

type ExamSubmitBarProps = {
  unanswered: number;
  submitting: boolean;
  autoSubmitted: boolean;
  onSubmit: () => void;
};

function confirmMessage(unanswered: number): string {
  const lead = unanswered > 0 ? he.examSubmitConfirmUnanswered(unanswered) : he.examSubmitConfirmAllAnswered;
  return `${lead} ${he.examSubmitConfirmMessage}`;
}

/** Remise de l'examen officiel : confirmation indiquant combien de questions restent sans réponse. */
export default function ExamSubmitBar({ unanswered, submitting, autoSubmitted, onSubmit }: ExamSubmitBarProps) {
  const [confirming, setConfirming] = useState(false);
  const confirm = () => {
    setConfirming(false);
    onSubmit();
  };
  return (
    <Box sx={{ mt: 3, mb: 2 }}>
      <Button variant="contained" size="large" endIcon={<SendIcon sx={{ transform: "scaleX(-1)" }} />} disabled={submitting} onClick={() => setConfirming(true)}>
        {submitting ? he.loading : he.submitExam}
      </Button>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        {he.submitExamPartialHint}
      </Typography>
      {autoSubmitted && (
        <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
          {he.examAutoSubmittedHint}
        </Typography>
      )}
      <ConfirmDialog
        open={confirming}
        title={he.examSubmitConfirmTitle}
        message={confirmMessage(unanswered)}
        confirmLabel={he.submitExam}
        color={unanswered > 0 ? "warning" : "primary"}
        onClose={() => setConfirming(false)}
        onConfirm={confirm}
      />
    </Box>
  );
}
