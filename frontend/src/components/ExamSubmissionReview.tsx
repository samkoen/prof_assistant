import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { OptionDisplay } from "./MultilineOptionLayout";
import QuestionAiExplanation from "./QuestionAiExplanation";
import { useAuth } from "../context/AuthContext";
import type { ExamReview, ExamReviewCorrectOption, ExamReviewQuestion, ExplanationLanguage } from "../api/client";
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
}: {
  options: ExamReviewCorrectOption[];
  mark?: string;
  color: string;
}) {
  return (
    <>
      {options.map((o, optIdx) => (
        <OptionDisplay
          key={optIdx}
          prefix={optionPrefix(optIdx, options.length, mark)}
          text={o.text}
          color={color}
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

  return (
    <Card
      sx={{
        mb: 2,
        border: "1px solid",
        borderColor: wrong ? "error.light" : "success.light",
        bgcolor: wrong ? "rgba(211, 47, 47, 0.04)" : "rgba(76, 175, 80, 0.04)",
      }}
    >
      <CardContent>
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
        <Typography fontWeight={600} component="div" sx={{ whiteSpace: "pre-wrap", mb: 1.5 }}>
          {index + 1}. {q.text}{" "}
          <Typography component="span" variant="body2" color="text.secondary">
            ({q.points} נק')
          </Typography>
        </Typography>
        {wrong && (
          <>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {he.yourAnswerLabel}
            </Typography>
            {q.student_options.length > 0 ? (
              <ReviewOptions options={q.student_options} mark="✗" color="error.main" />
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
        <ReviewOptions options={q.correct_options} color="success.main" />
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
