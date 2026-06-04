import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { updateAiExplanationLanguage, type ExplanationLanguage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { he } from "../i18n/he";
import { hebrewAccordionSx } from "../styles/hebrewAlign";

const LANGUAGE_OPTIONS: Array<{ value: ExplanationLanguage; label: string }> = [
  { value: "he", label: he.languageHebrew },
  { value: "fr", label: he.languageFrench },
  { value: "en", label: he.languageEnglish },
  { value: "ru", label: he.languageRussian },
];

export default function StudentGeminiConfigCard() {
  const { user, refresh } = useAuth();
  const value = user?.ai_explanation_language ?? "he";

  return (
    <Accordion defaultExpanded sx={{ mb: 2, ...hebrewAccordionSx }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" fontWeight={600} sx={{ width: "100%", textAlign: "right" }}>
          {he.studentExamAiSettingsTitle}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 520 }}>
          <TextField
            select
            size="small"
            label={he.aiExplanationLanguage}
            helperText={he.aiExplanationLanguageHelper}
            value={value}
            onChange={async (e) => {
              const next = e.target.value as ExplanationLanguage;
              await updateAiExplanationLanguage(next);
              await refresh();
            }}
            sx={{ minWidth: 220, width: "100%", maxWidth: 320, textAlign: "right" }}
            FormHelperTextProps={{ sx: { textAlign: "right", mx: 0 } }}
          >
          {LANGUAGE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
          </TextField>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
