import { Box, Typography } from "@mui/material";
import { ExamQuestionReadView } from "./ExamQuestionReadView";
import { contentDirForQuestionText } from "../utils/examQuestionsLanguage";
import type { QuestionType } from "../utils/qcmImportParser";
import { he } from "../i18n/he";

type DraftOption = {
  text: string;
  is_correct: boolean;
  image_url?: string | null;
};

type QuestionDraftPreviewProps = {
  text: string;
  imageUrl: string | null;
  questionType: QuestionType;
  points: number;
  options: DraftOption[];
  showHeading?: boolean;
};

function hasPreviewContent(text: string, imageUrl: string | null, options: DraftOption[]): boolean {
  if (text.trim() || imageUrl?.trim()) return true;
  return options.some((o) => o.text.trim() || o.image_url?.trim());
}

export default function QuestionDraftPreview({
  text,
  imageUrl,
  questionType,
  points,
  options,
  showHeading = true,
}: QuestionDraftPreviewProps) {
  if (!hasPreviewContent(text, imageUrl, options)) return null;

  const contentDir = contentDirForQuestionText(text);
  return (
    <Box
      dir={contentDir}
      sx={{ mt: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1, border: "1px solid", borderColor: "divider" }}
    >
      {showHeading && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {he.questionEditPreview}
        </Typography>
      )}
      <ExamQuestionReadView
        index={1}
        text={text}
        imageUrl={imageUrl}
        questionType={questionType}
        points={points}
        options={options.map((o) => ({
          text: o.text,
          is_correct: o.is_correct,
          image_url: o.image_url,
        }))}
        contentDir={contentDir}
      />
    </Box>
  );
}
