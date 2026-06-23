import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import { examMarkdownSx } from "../styles/examMarkdownSx";

interface AiExplanationMarkdownProps {
  content: string;
  dir: "rtl" | "ltr";
}

export default function AiExplanationMarkdown({ content, dir }: AiExplanationMarkdownProps) {
  return (
    <Box dir={dir} sx={examMarkdownSx(dir)}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </Box>
  );
}
