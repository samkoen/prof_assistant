import type { ReactNode } from "react";
import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import MixedTextLine from "./MixedTextLine";
import { parseDisplayTextSegments, type MarkedTextSegment } from "../utils/codeBlockMarkup";
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
  /** Une ligne = un bloc (évite que le markdown fusionne du code LTR dans un paragraphe RTL). */
  lineByLine?: boolean;
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

function LineByLineBlock({
  content,
  questionText,
  firstLineExtra,
}: {
  content: string;
  questionText?: string;
  firstLineExtra?: ReactNode;
}) {
  return (
    <>
      {content.split("\n").map((line, i) => (
        <MixedTextLine key={i} line={line} questionText={questionText}>
          {i === 0 ? firstLineExtra : undefined}
        </MixedTextLine>
      ))}
    </>
  );
}

function PlainTextBlock({
  content,
  questionText,
  firstLineExtra,
  lineByLine,
}: {
  content: string;
  questionText?: string;
  firstLineExtra?: ReactNode;
  lineByLine?: boolean;
}) {
  if (lineByLine || !usesMarkdownSyntax(content)) {
    return (
      <LineByLineBlock
        content={content}
        questionText={questionText}
        firstLineExtra={firstLineExtra}
      />
    );
  }
  const dir = textDir(content, questionText);
  return (
    <Box sx={examMarkdownSx(dir)}>
      {firstLineExtra}
      <ReactMarkdown>{content}</ReactMarkdown>
    </Box>
  );
}

function CodeBlock({ content }: { content: string }) {
  return (
    <Box component="pre" sx={{ ...codeBlockDisplaySx, m: 0 }}>
      {content}
    </Box>
  );
}

function segmentView(
  seg: MarkedTextSegment,
  i: number,
  extra: ReactNode,
  questionText: string | undefined,
  lineByLine: boolean | undefined,
) {
  if (seg.kind === "code") {
    return <CodeBlock key={`code-${i}`} content={seg.content} />;
  }
  return (
    <PlainTextBlock
      key={`text-${i}`}
      content={seg.content}
      questionText={questionText}
      firstLineExtra={extra}
      lineByLine={lineByLine}
    />
  );
}

function DisplaySegments({
  segments,
  questionText,
  firstLineExtra,
  lineByLine,
}: {
  segments: MarkedTextSegment[];
  questionText?: string;
  firstLineExtra?: ReactNode;
  lineByLine?: boolean;
}) {
  let firstText = true;
  return (
    <>
      {segments.map((seg, i) => {
        const extra = firstText && seg.kind !== "code" ? firstLineExtra : undefined;
        if (seg.kind !== "code") firstText = false;
        return segmentView(seg, i, extra, questionText, lineByLine);
      })}
    </>
  );
}

/** Texte avec blocs ``` , diagrammes ASCII et markdown inline (** gras, listes). */
export default function CodeMarkedText({
  text,
  questionText,
  firstLineExtra,
  lineByLine = false,
}: CodeMarkedTextProps) {
  const displayText = stripEditorBidiMarks(text);
  const segments = parseDisplayTextSegments(displayText);
  if (segments.length === 0) {
    return firstLineExtra ? (
      <MixedTextLine line="" questionText={questionText}>
        {firstLineExtra}
      </MixedTextLine>
    ) : null;
  }
  return (
    <DisplaySegments
      segments={segments}
      questionText={questionText}
      firstLineExtra={firstLineExtra}
      lineByLine={lineByLine}
    />
  );
}
