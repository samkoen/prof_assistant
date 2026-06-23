import type { ReactNode } from "react";
import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import MixedTextLine from "./MixedTextLine";
import { parseDisplayTextSegments } from "../utils/codeBlockMarkup";
import { codeBlockDisplaySx } from "../utils/mixedLineDisplay";
import {
  contentDirForOptionText,
  contentDirForQuestionText,
  stripEditorBidiMarks,
} from "../utils/examQuestionsLanguage";
import { examMarkdownSx } from "../styles/examMarkdownSx";

type CodeMarkedTextProps = {
  text: string;
  questionText?: string;
  firstLineExtra?: ReactNode;
};

function textDir(content: string, questionText?: string): "ltr" | "rtl" {
  if (questionText && questionText !== content) {
    return contentDirForOptionText(content, questionText);
  }
  return contentDirForQuestionText(content);
}

function usesMarkdownSyntax(content: string): boolean {
  return /(\*\*.+?\*\*|__.+?__|(^|\n)[\-*]\s|(^|\n)\d+\.\s|`[^`\n]+`)/m.test(content);
}

function PlainTextBlock({
  content,
  questionText,
  firstLineExtra,
}: {
  content: string;
  questionText?: string;
  firstLineExtra?: ReactNode;
}) {
  const dir = textDir(content, questionText);
  if (!usesMarkdownSyntax(content)) {
    const lines = content.split("\n");
    return (
      <>
        {lines.map((line, i) => (
          <MixedTextLine key={i} line={line} questionText={questionText}>
            {i === 0 ? firstLineExtra : undefined}
          </MixedTextLine>
        ))}
      </>
    );
  }
  return (
    <Box sx={examMarkdownSx(dir)}>
      {firstLineExtra}
      <ReactMarkdown>{content}</ReactMarkdown>
    </Box>
  );
}

function CodeBlock({ content }: { content: string }) {
  return <Box component="pre" sx={{ ...codeBlockDisplaySx, m: 0 }}>{content}</Box>;
}

/** Texte avec blocs ``` , diagrammes ASCII et markdown inline (** gras, listes). */
export default function CodeMarkedText({ text, questionText, firstLineExtra }: CodeMarkedTextProps) {
  const displayText = stripEditorBidiMarks(text);
  const segments = parseDisplayTextSegments(displayText);
  if (segments.length === 0) {
    return firstLineExtra ? (
      <MixedTextLine line="" questionText={questionText}>
        {firstLineExtra}
      </MixedTextLine>
    ) : null;
  }

  let firstText = true;
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === "code") {
          return <CodeBlock key={`code-${i}`} content={seg.content} />;
        }
        const extra = firstText ? firstLineExtra : undefined;
        firstText = false;
        return (
          <PlainTextBlock
            key={`text-${i}`}
            content={seg.content}
            questionText={questionText}
            firstLineExtra={extra}
          />
        );
      })}
    </>
  );
}
