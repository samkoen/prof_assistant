import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import { api, ApiError, type AiExplanation } from "../api/client";
import { he } from "../i18n/he";

interface QuestionAiExplanationProps {
  sessionId: number;
  questionId: number;
}

export default function QuestionAiExplanation({
  sessionId,
  questionId,
}: QuestionAiExplanationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");

  const requestExplanation = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api<AiExplanation>(
        `/api/exams/sessions/${sessionId}/questions/${questionId}/explain`,
        { method: "POST" }
      );
      setExplanation(res.explanation);
    } catch (e) {
      setExplanation("");
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box dir="rtl" sx={{ mt: 2 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={loading ? <CircularProgress size={16} /> : <AutoStoriesOutlinedIcon />}
        onClick={requestExplanation}
        disabled={loading}
      >
        {loading ? he.loading : he.aiExplainAnswer}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {explanation && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 1,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle2" color="primary" gutterBottom>
            {he.aiExplanationTitle}
          </Typography>
          <Typography
            component="div"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "visible" }}
          >
            {explanation}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
