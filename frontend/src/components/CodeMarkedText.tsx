import type { ReactNode } from "react";
import { Box } from "@mui/material";
import MixedTextLine from "./MixedTextLine";
import { parseMarkedTextSegments } from "../utils/codeBlockMarkup";
import { codeBlockDisplaySx } from "../utils/mixedLineDisplay";
import { stripEditorBidiMarks } from "../utils/examQuestionsLanguage";

type CodeMarkedTextProps = {
  text: string;
  questionText?: string;
  firstLineExtra?: ReactNode;
};

function PlainTextBlock({
  content,
  questionText,
  firstLineExtra,
}: {
  content: string;
  questionText?: string;
  firstLineExtra?: ReactNode;
}) {
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

function CodeBlock({ content }: { content: string }) {
  return <Box component="pre" sx={{ ...codeBlockDisplaySx, m: 0 }}>{content}</Box>;
}

/** Texte avec blocs ``` code ``` marqués explicitement par le professeur. */
export default function CodeMarkedText({ text, questionText, firstLineExtra }: CodeMarkedTextProps) {
  const displayText = stripEditorBidiMarks(text);
  const segments = parseMarkedTextSegments(displayText);
  if (segments.length === 0) {
    return firstLineExtra ? <MixedTextLine line="" questionText={questionText}>{firstLineExtra}</MixedTextLine> : null;
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
