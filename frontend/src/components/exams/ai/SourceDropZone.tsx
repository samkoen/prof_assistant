import { useRef, useState, type DragEvent } from "react";
import { alpha, Box, Typography } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { he } from "../../../i18n/he";
import { brand } from "../../../theme/brand";
import { ACCEPTED_SOURCE_EXTENSIONS } from "../../../utils/geminiSourceRole";
import Spinner from "../../ui/Spinner";

type SourceDropZoneProps = {
  disabled?: boolean;
  uploading: boolean;
  onFiles: (files: File[]) => void;
};

/** Zone unique de dépôt (glisser-déposer ou clic) pour tous les fichiers sources. */
export default function SourceDropZone({ disabled, uploading, onFiles }: SourceDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const inactive = disabled || uploading;

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!inactive) onFiles(Array.from(e.dataTransfer.files));
  };
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!inactive) setDragging(true);
  };

  return (
    <Box
      dir="rtl"
      role="button"
      tabIndex={inactive ? -1 : 0}
      aria-disabled={inactive}
      onClick={() => !inactive && inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !inactive && inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      sx={{
        textAlign: "center",
        px: 2,
        py: 3,
        borderRadius: 3,
        cursor: inactive ? "default" : "pointer",
        border: `2px dashed ${alpha(brand.violet600, dragging ? 0.8 : 0.3)}`,
        bgcolor: alpha(brand.violet600, dragging ? 0.1 : 0.03),
        opacity: disabled ? 0.6 : 1,
        transition: "background-color 0.15s, border-color 0.15s",
        "&:hover": inactive ? undefined : { bgcolor: alpha(brand.violet600, 0.07) },
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPTED_SOURCE_EXTENSIONS.join(",")}
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {uploading ? <Spinner size={28} /> : <CloudUploadOutlinedIcon sx={{ fontSize: 32, color: brand.violet600 }} />}
      <Typography fontWeight={700} sx={{ mt: 0.5 }}>
        {uploading ? he.geminiDropUploading : dragging ? he.geminiDropActive : he.geminiDropTitle}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {he.geminiSourcesAcceptedFormats}
      </Typography>
    </Box>
  );
}
