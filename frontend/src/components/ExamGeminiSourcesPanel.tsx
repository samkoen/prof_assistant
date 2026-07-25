import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/Upload";
import { ApiError } from "../api/client";
import {
  deleteGeminiSource,
  listGeminiSources,
  updateGeminiSource,
  uploadGeminiSource,
} from "../api/geminiSources";
import type { GeminiSource, GeminiSourceType } from "../types/geminiSource";
import { hebrewAlignRightSx, hebrewCardRowSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

type Props = {
  examId: number;
  disabled?: boolean;
  onSelectedIdsChange: (ids: number[]) => void;
  onError: (message: string) => void;
};

function sourceTypeLabel(type: GeminiSourceType): string {
  return type === "exercises_file" ? he.geminiSourceExercises : he.geminiSourceCourse;
}

export default function ExamGeminiSourcesPanel({
  examId,
  disabled,
  onSelectedIdsChange,
  onError,
}: Props) {
  const [sources, setSources] = useState<GeminiSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const exercisesInputRef = useRef<HTMLInputElement>(null);
  const courseInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listGeminiSources(examId);
      setSources(list);
      onSelectedIdsChange(list.map((s) => s.id));
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [examId, onError, onSelectedIdsChange]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (file: File, sourceType: GeminiSourceType) => {
    setUploading(true);
    onError("");
    try {
      await uploadGeminiSource(examId, file, sourceType);
      await load();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setUploading(false);
    }
  };

  const onFilePick = (sourceType: GeminiSourceType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await handleUpload(file, sourceType);
  };

  const toggleFlag = async (src: GeminiSource, field: "use_as_style" | "use_as_content", checked: boolean) => {
    onError("");
    try {
      const updated = await updateGeminiSource(src.id, { [field]: checked });
      setSources((prev) => prev.map((s) => (s.id === src.id ? updated : s)));
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
      await load();
    }
  };

  const remove = async (sourceId: number) => {
    onError("");
    try {
      await deleteGeminiSource(sourceId);
      await load();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  return (
    <Box sx={{ mb: 3 }} dir="rtl">
      <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={hebrewAlignRightSx}>
        {he.geminiSourcesTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph sx={hebrewAlignRightSx}>
        {he.geminiSourcesIntro}
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        {he.geminiSourcesPrivacy}
      </Alert>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, ...hebrewAlignRightSx }}>
        {he.geminiSourcesAcceptedFormats}
      </Typography>
      <Box sx={{ ...hebrewCardRowSx, py: 0, mb: 2, gap: 1 }}>
        <input
          ref={exercisesInputRef}
          type="file"
          hidden
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          onChange={onFilePick("exercises_file")}
        />
        <input
          ref={courseInputRef}
          type="file"
          hidden
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          onChange={onFilePick("course_file")}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
          disabled={disabled || uploading}
          onClick={() => exercisesInputRef.current?.click()}
        >
          {he.geminiUploadExercises}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
          disabled={disabled || uploading}
          onClick={() => courseInputRef.current?.click()}
        >
          {he.geminiUploadCourse}
        </Button>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      ) : sources.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={hebrewAlignRightSx}>
          {he.geminiSourcesEmpty}
        </Typography>
      ) : (
        sources.map((src) => (
          <Box
            key={src.id}
            sx={{
              mb: 1.5,
              p: 1.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Box sx={{ ...hebrewCardRowSx, py: 0, mb: 1 }}>
              <IconButton
                size="small"
                color="error"
                onClick={() => remove(src.id)}
                disabled={disabled}
                aria-label={he.geminiSourceDelete}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
              <Box sx={{ flex: 1, ...hebrewAlignRightSx }}>
                <Typography variant="body2" fontWeight={600}>
                  {src.original_filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {sourceTypeLabel(src.source_type)} · {src.char_count.toLocaleString("he-IL")}{" "}
                  {he.geminiSourceChars}
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={src.use_as_style}
                  onChange={(e) => toggleFlag(src, "use_as_style", e.target.checked)}
                  disabled={disabled}
                />
              }
              label={he.geminiSourceUseStyle}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={src.use_as_content}
                  onChange={(e) => toggleFlag(src, "use_as_content", e.target.checked)}
                  disabled={disabled}
                />
              }
              label={he.geminiSourceUseContent}
            />
          </Box>
        ))
      )}
    </Box>
  );
}
