import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { api, ApiError, type ExamDetail } from "../api/client";
import { buildExamPortableExport } from "../utils/examPortableExport";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

interface ExamPortableExportDialogProps {
  open: boolean;
  examId: number;
  examTitle: string;
  initialExam?: ExamDetail | null;
  onClose: () => void;
  onCopied?: (message: string) => void;
}

async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export default function ExamPortableExportDialog({
  open,
  examId,
  examTitle,
  initialExam,
  onClose,
  onCopied,
}: ExamPortableExportDialogProps) {
  const [exam, setExam] = useState<ExamDetail | null>(initialExam ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadExam = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<ExamDetail>(`/api/exams/${examId}`);
      setExam(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (!open) {
      setSuccess("");
      setError("");
      return;
    }
    if (initialExam != null) {
      setExam(initialExam);
      return;
    }
    void loadExam();
  }, [open, initialExam, loadExam]);

  const exportData = exam ? buildExamPortableExport(exam) : null;

  const handleCopy = async (text: string, message: string) => {
    try {
      await copyText(text);
      setError("");
      setSuccess(message);
      onCopied?.(message);
    } catch {
      setSuccess("");
      setError(he.portableExportCopyFailed);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle>{he.portableExportTitle}</DialogTitle>
      <DialogContent>
        <Box sx={hebrewAlignRightSx}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {he.portableExportIntro}
          </Typography>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
            {examTitle}
          </Typography>
          <PortableSteps />
          {success && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          )}
          {!loading && exportData && <ExportSections exportData={exportData} onCopy={handleCopy} />}
          {!loading && exportData?.questionCount === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {he.portableExportNoQuestions}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.close}</Button>
      </DialogActions>
    </Dialog>
  );
}

function PortableSteps() {
  const steps = [
    he.portableExportStep1,
    he.portableExportStep2,
    he.portableExportStep3,
    he.portableExportStep4,
  ];
  return (
    <Box component="ol" sx={{ m: 0, mt: 1, paddingInlineStart: 2.5, color: "text.secondary" }}>
      {steps.map((step) => (
        <Typography key={step} component="li" variant="body2" sx={{ mb: 0.5 }}>
          {step}
        </Typography>
      ))}
    </Box>
  );
}

function ExportSections({
  exportData,
  onCopy,
}: {
  exportData: ReturnType<typeof buildExamPortableExport>;
  onCopy: (text: string, message: string) => Promise<void>;
}) {
  return (
    <Box sx={{ mt: 2 }}>
      {exportData.imageWarnings.length > 0 && (
        <ImageWarnings warnings={exportData.imageWarnings} />
      )}
      <ExportBlock
        title={he.portableExportSettings}
        value={exportData.settingsText}
        copyLabel={he.portableCopySettings}
        onCopy={() => onCopy(exportData.settingsText, he.portableSettingsCopied)}
      />
      {exportData.questionCount > 0 && (
        <ExportBlock
          title={he.portableExportQuestions}
          value={exportData.questionsText}
          copyLabel={he.portableCopyQuestions}
          onCopy={() => onCopy(exportData.questionsText, he.portableQuestionsCopied)}
        />
      )}
    </Box>
  );
}

function ImageWarnings({
  warnings,
}: {
  warnings: ReturnType<typeof buildExamPortableExport>["imageWarnings"];
}) {
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <Typography variant="body2" fontWeight={600} gutterBottom>
        {he.portableExportImagesWarning}
      </Typography>
      {warnings.map((w) => (
        <Typography key={w.questionIndex} variant="body2">
          {he.portableExportImageQuestion} {w.questionIndex}: {w.optionLabels.join(", ")}
        </Typography>
      ))}
    </Alert>
  );
}

function ExportBlock({
  title,
  value,
  copyLabel,
  onCopy,
}: {
  title: string;
  value: string;
  copyLabel: string;
  onCopy: () => Promise<void>;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          {title}
        </Typography>
        <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => void onCopy()}>
          {copyLabel}
        </Button>
      </Box>
      <TextField
        multiline
        minRows={4}
        maxRows={12}
        fullWidth
        value={value}
        InputProps={{ readOnly: true }}
        dir="rtl"
        sx={{ fontFamily: "monospace", "& .MuiInputBase-input": { fontSize: "0.8rem" } }}
      />
    </Box>
  );
}
