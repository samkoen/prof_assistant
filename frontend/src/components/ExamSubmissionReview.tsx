import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { OptionDisplay } from "./MultilineOptionLayout";
import QuestionImageDisplay from "./QuestionImageDisplay";
import QuestionAiExplanation from "./QuestionAiExplanation";
import { examQuestionLtrSx } from "./examQuestionLtrStyles";
import QuestionTextWithIndex from "./QuestionTextWithIndex";
import {
  contentDirForOptionText,
  contentDirForQuestionText,
} from "../utils/examQuestionsLanguage";
import { useAuth } from "../context/AuthContext";
import type { ExamReview, ExamReviewCorrectOption, ExamReviewQuestion, ExplanationLanguage } from "../api/client";
import { formatExamPointsLabel } from "../utils/examQuestionsLanguage";
import { he } from "../i18n/he";

interface ExamSubmissionReviewProps {
  review: ExamReview;
}

function optionPrefix(idx: number, total: number, mark?: string): string {
  const letter = `${String.fromCharCode(65 + idx)})`;
  if (total <= 1) return mark ?? "";
  return mark ? `${mark} ${letter}` : letter;
}

function ReviewOptions({
  options,
  mark,
  color,
  examDir,
  questionText,
}: {
  options: ExamReviewCorrectOption[];
  mark?: string;
  color: string;
  examDir: "ltr" | "rtl";
  questionText: string;
}) {
  return (
    <>
      {options.map((o, optIdx) => (
        <OptionDisplay
          key={optIdx}
          prefix={optionPrefix(optIdx, options.length, mark)}
          text={o.text}
          imageUrl={o.image_url}
          color={color}
          dir={contentDirForOptionText(o.text, questionText)}
          examDir={examDir}
          questionText={questionText}
        />
      ))}
    </>
  );
}

function ReviewQuestionCard({
  q,
  index,
  sessionId,
  language,
}: {
  q: ExamReviewQuestion;
  index: number;
  sessionId: number;
  language: ExplanationLanguage;
}) {
  const wrong = !q.is_correct;
  const qDir = contentDirForQuestionText(q.text);
  const ltr = qDir === "ltr";
  const pointsLabel = formatExamPointsLabel(q.points, qDir);

  return (
    <Card
      sx={{
        mb: 2,
        border: "1px solid",
        borderColor: wrong ? "error.light" : "success.light",
        bgcolor: wrong ? "rgba(211, 47, 47, 0.04)" : "rgba(76, 175, 80, 0.04)",
      }}
    >
      <CardContent dir={qDir} sx={ltr ? examQuestionLtrSx : { textAlign: "right" }}>
        <Box display="flex" alignItems="flex-start" gap={1} flexWrap="wrap" mb={1}>
          <Chip
            size="small"
            icon={wrong ? <CloseIcon /> : <CheckIcon />}
            label={wrong ? he.questionAnsweredWrong : he.questionAnsweredCorrectly}
            color={wrong ? "error" : "success"}
            sx={{
              "& .MuiChip-icon": {
                marginInlineStart: "6px",
                marginInlineEnd: "-2px",
              },
            }}
          />
        </Box>
        <QuestionTextWithIndex index={index + 1} text={q.text} sx={{ mb: 1.5 }}>
          {" "}
          <Typography component="span" variant="body2" color="text.secondary">
            ({pointsLabel})
          </Typography>
        </QuestionTextWithIndex>
        <QuestionImageDisplay url={q.image_url} />
        {wrong && (
          <>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {he.yourAnswerLabel}
            </Typography>
            {q.student_options.length > 0 ? (
              <ReviewOptions
                options={q.student_options}
                mark="✗"
                color="error.main"
                examDir={qDir}
                questionText={q.text}
              />
            ) : (
              <Typography variant="body2" color="error.main" sx={{ mb: 1.5 }}>
                {he.noAnswerGiven}
              </Typography>
            )}
          </>
        )}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {he.correctAnswerLabel}
        </Typography>
        <ReviewOptions
          options={q.correct_options}
          color="success.main"
          examDir={qDir}
          questionText={q.text}
        />
        <QuestionAiExplanation sessionId={sessionId} questionId={q.id} language={language} />
      </CardContent>
    </Card>
  );
}

export default function ExamSubmissionReview({ review }: ExamSubmissionReviewProps) {
  const { user } = useAuth();
  const language: ExplanationLanguage = user?.ai_explanation_language ?? "he";
  if (!review.show_correction || review.questions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {he.examReviewTitle}
      </Typography>
      {review.questions.map((q, i) => (
        <ReviewQuestionCard
          key={q.id}
          q={q}
          index={i}
          sessionId={review.session_id}
          language={language}
        />
      ))}
    </Box>
  );
}
