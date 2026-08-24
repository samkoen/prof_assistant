import { Box } from "@mui/material";
import CodeMarkedText from "./CodeMarkedText";

interface AiExplanationMarkdownProps {
  content: string;
  dir?: "rtl" | "ltr";
}

/** Même rendu que les questions (code LTR ligne par ligne, hébreu RTL). */
export default function AiExplanationMarkdown({ content }: AiExplanationMarkdownProps) {
  return (
    <Box sx={{ typography: "body2" }}>
      <CodeMarkedText text={content} questionText={content} lineByLine />
    </Box>
  );
}
