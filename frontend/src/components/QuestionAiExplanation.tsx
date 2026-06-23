import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import { api, ApiError, type AiExplanation } from "../api/client";
import AiExplanationMarkdown from "./AiExplanationMarkdown";
import { he } from "../i18n/he";

interface QuestionAiExplanationProps {
  sessionId: number;
  questionId: number;
  language: ExplanationLanguage;
  forPractice?: boolean;
}

export type ExplanationLanguage = "he" | "fr" | "en" | "ru";

export default function QuestionAiExplanation({
  sessionId,
  questionId,
  language,
  forPractice = false,
}: QuestionAiExplanationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const explanationDir = language === "he" || language === "ru" ? "rtl" : "ltr";

  const requestExplanation = async (regenerate = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await api<AiExplanation>(
        `/api/exams/sessions/${sessionId}/questions/${questionId}/explain`,
        {
          method: "POST",
          body: JSON.stringify({ language, regenerate, for_practice: forPractice }),
        }
      );
      setExplanation(res.explanation);
      setFromCache(Boolean(res.from_cache));
    } catch (e) {
      setExplanation("");
      setFromCache(false);
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box dir="rtl" sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : <AutoStoriesOutlinedIcon />}
          onClick={() => requestExplanation(false)}
          disabled={loading}
        >
          {loading ? he.loading : he.aiExplainAnswer}
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() => requestExplanation(true)}
          disabled={loading}
        >
          {he.aiExplainRegenerate}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {explanation && (
        <Box
          dir={explanationDir}
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 1,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
            textAlign: "start",
            unicodeBidi: "isolate",
            "& .MuiTypography-root": {
              direction: explanationDir,
              textAlign: "start",
            },
          }}
        >
          <Typography variant="subtitle2" color="primary" gutterBottom>
            {he.aiExplanationTitle}
          </Typography>
          {fromCache && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              {he.aiExplanationFromCache}
            </Typography>
          )}
          <AiExplanationMarkdown content={explanation} dir={explanationDir} />
        </Box>
      )}
    </Box>
  );
}
