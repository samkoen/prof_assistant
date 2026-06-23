import { Box, type SxProps, type Theme } from "@mui/material";
import { resolveApiUrl } from "../api/client";

type QuestionImageDisplayProps = {
  url: string | null | undefined;
  alt?: string;
  maxHeight?: number;
  sx?: SxProps<Theme>;
};

/** Affiche une image de question/réponse avec URL API relative. */
export default function QuestionImageDisplay({
  url,
  alt = "",
  maxHeight = 220,
  sx,
}: QuestionImageDisplayProps) {
  if (!url) return null;
  const src = resolveApiUrl(url);
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        display: "block",
        maxWidth: "100%",
        maxHeight,
        mt: 1,
        mb: 1,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        ...sx,
      }}
    />
  );
}
