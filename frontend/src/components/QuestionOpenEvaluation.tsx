import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { api, ApiError, type ExamReviewQuestion, type OpenEvaluation } from "../api/client";
import AiExplanationMarkdown from "./AiExplanationMarkdown";
import { he } from "../i18n/he";
import type { ExplanationLanguage } from "./QuestionAiExplanation";

interface QuestionOpenEvaluationProps {
  sessionId: number;
  question: ExamReviewQuestion;
  language: ExplanationLanguage;
  forPractice?: boolean;
  onAttemptScore?: (score: number | null, maxScore: number | null) => void;
}

function evaluationDir(language: ExplanationLanguage): "rtl" | "ltr" {
  return language === "he" || language === "ru" ? "rtl" : "ltr";
}

export default function QuestionOpenEvaluation({
  sessionId,
  question,
  language,
  forPractice = false,
  onAttemptScore,
}: QuestionOpenEvaluationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OpenEvaluation | null>(
    question.appreciation
      ? {
          question_id: question.id,
          appreciation: question.appreciation,
          suggested_score: question.earned_points ?? 0,
          model_answer: question.model_answer,
          from_cache: true,
        }
      : null,
  );
  const dir = evaluationDir(language);

  const requestEval = async (regenerate = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await api<OpenEvaluation>(
        `/api/exams/sessions/${sessionId}/questions/${question.id}/open-evaluate`,
        {
          method: "POST",
          body: JSON.stringify({ regenerate, for_practice: forPractice }),
        },
      );
      setResult(res);
      onAttemptScore?.(res.attempt_score ?? null, res.attempt_max_score ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result || loading) return;
    void requestEval(false);
    // auto-évaluation une fois après soumission
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  return (
    <Box dir="rtl" sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" size="small" onClick={() => requestEval(false)} disabled={loading}>
          {loading ? <CircularProgress size={16} /> : he.openEvaluationTitle}
        </Button>
        <Button variant="text" size="small" onClick={() => requestEval(true)} disabled={loading}>
          {he.aiExplainRegenerate}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {result && (
        <Box
          dir={dir}
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 1,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
            textAlign: "start",
          }}
        >
          <Typography variant="subtitle2" color="primary" gutterBottom>
            {he.openEvaluationTitle}
            {" — "}
            {he.openEarnedPoints(result.suggested_score, question.points)}
          </Typography>
          {result.from_cache && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              {he.aiExplanationFromCache}
            </Typography>
          )}
          {result.model_answer && (
            <>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {he.correctAnswerLabel}
              </Typography>
              <Box sx={{ mb: 1.5 }}>
                <AiExplanationMarkdown content={result.model_answer} />
              </Box>
            </>
          )}
          <AiExplanationMarkdown content={result.appreciation} dir={dir} />
        </Box>
      )}
    </Box>
  );
}
