import { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import { he } from "../i18n/he";
import { copyStudentExamLink } from "../utils/studentExamLink";

type StudentExamLinkButtonProps = {
  offeringId: number;
  sessionId: number;
  onCopied?: (message: string) => void;
  onError?: (message: string) => void;
};

export default function StudentExamLinkButton({
  offeringId,
  sessionId,
  onCopied,
  onError,
}: StudentExamLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyStudentExamLink(offeringId, sessionId);
      setCopied(true);
      onCopied?.(he.studentExamLinkCopied);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onError?.(he.portableExportCopyFailed);
    }
  };

  return (
    <Tooltip title={copied ? he.studentExamLinkCopied : he.copyStudentExamLink}>
      <IconButton size="small" color="primary" aria-label={he.copyStudentExamLink} onClick={() => void handleCopy()}>
        <LinkIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
