import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { OptionDisplay } from "./MultilineOptionLayout";
import type { ExamReview } from "../api/client";
import { he } from "../i18n/he";

interface ExamSubmissionReviewProps {
  review: ExamReview;
}

export default function ExamSubmissionReview({ review }: ExamSubmissionReviewProps) {
  if (!review.show_correction || review.questions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {he.examReviewTitle}
      </Typography>
      {review.questions.map((q, i) => (
        <Card
          key={q.id}
          sx={{
            mb: 2,
            border: "1px solid",
            borderColor: q.is_correct ? "success.light" : "error.light",
            bgcolor: q.is_correct ? "rgba(76, 175, 80, 0.04)" : "rgba(211, 47, 47, 0.04)",
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="flex-start" gap={1} flexWrap="wrap" mb={1}>
              <Chip
                size="small"
                icon={q.is_correct ? <CheckIcon /> : <CloseIcon />}
                label={q.is_correct ? he.questionAnsweredCorrectly : he.questionAnsweredWrong}
                color={q.is_correct ? "success" : "error"}
              />
            </Box>
            <Typography fontWeight={600} component="div" sx={{ whiteSpace: "pre-wrap", mb: 1.5 }}>
              {i + 1}. {q.text}{" "}
              <Typography component="span" variant="body2" color="text.secondary">
                ({q.points} נק')
              </Typography>
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {he.correctAnswerLabel}
            </Typography>
            {q.correct_options.map((o, optIdx) => (
              <OptionDisplay
                key={optIdx}
                prefix={
                  q.correct_options.length > 1
                    ? `✓ ${String.fromCharCode(65 + optIdx)})`
                    : "✓"
                }
                text={o.text}
                color="success.main"
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
