import { useState } from "react";
import { CircularProgress, IconButton, Tooltip } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { ApiError, downloadExamPdf, type Exam } from "../api/client";
import { he } from "../i18n/he";

type ExamPdfDownloadButtonProps = {
  exam: Exam;
  onError: (message: string) => void;
  iconOnly?: boolean;
};

export default function ExamPdfDownloadButton({
  exam,
  onError,
  iconOnly = true,
}: ExamPdfDownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  if (exam.question_count <= 0) return null;

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadExamPdf(exam.id, exam.title);
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  if (!iconOnly) return null;

  return (
    <Tooltip title={busy ? he.loading : he.downloadExamPdf}>
      <span>
        <IconButton
          size="small"
          color="primary"
          aria-label={he.downloadExamPdf}
          disabled={busy}
          onClick={handleDownload}
        >
          {busy ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
        </IconButton>
      </span>
    </Tooltip>
  );
}
