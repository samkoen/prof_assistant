import { Box } from "@mui/material";
import StatusChip from "../../ui/StatusChip";
import { he } from "../../../i18n/he";
import type { RequestSummary } from "../../../utils/geminiFlow";

/** Récapitulatif de la demande (questions, séries, fichiers) juste avant l'envoi. */
export default function GeminiRequestSummary({ summary }: { summary: RequestSummary }) {
  return (
    <Box dir="rtl" sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
      <StatusChip label={he.geminiSummaryQuestions(summary.questions)} tone="violet" />
      {summary.series > 1 && <StatusChip label={he.geminiSummarySeries(summary.series)} tone="neutral" />}
      <StatusChip
        label={summary.files > 0 ? he.geminiSummaryFiles(summary.files) : he.geminiSummaryNoFiles}
        tone={summary.files > 0 ? "info" : "neutral"}
      />
    </Box>
  );
}
