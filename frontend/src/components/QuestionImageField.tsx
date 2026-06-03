import { useRef, useState } from "react";
import { Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ApiError, uploadQuestionImage } from "../api/client";
import QuestionImageDisplay from "./QuestionImageDisplay";
import { he } from "../i18n/he";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp";

type QuestionImageFieldProps = {
  examId: number;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  label?: string;
};

export default function QuestionImageField({
  examId,
  value,
  onChange,
  disabled = false,
  label,
}: QuestionImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pickFile = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadQuestionImage(examId, file);
      onChange(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.questionImageUploadError);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Box sx={{ mb: 1.5 }}>
      {label && (
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {label}
        </Typography>
      )}
      <QuestionImageDisplay url={value} />
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <Button
          size="small"
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={16} /> : <ImageIcon />}
          onClick={pickFile}
          disabled={disabled || uploading}
        >
          {he.addQuestionImage}
        </Button>
        {value && (
          <IconButton
            size="small"
            color="error"
            onClick={() => onChange(null)}
            disabled={disabled || uploading}
            aria-label={he.removeQuestionImage}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      {error && (
        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
