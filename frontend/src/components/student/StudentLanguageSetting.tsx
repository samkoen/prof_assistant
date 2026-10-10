import { Box, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import { updateAiExplanationLanguage, type ExplanationLanguage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";

const OPTIONS: Array<{ value: ExplanationLanguage; label: string }> = [
  { value: "he", label: he.languageHebrew },
  { value: "fr", label: he.languageFrench },
  { value: "en", label: he.languageEnglish },
  { value: "ru", label: he.languageRussian },
];

/** Choix compact de la langue des explications AI (remplace l'ancien accordéon « הגדרות »). */
export default function StudentLanguageSetting() {
  const { user, refresh } = useAuth();
  const change = async (value: ExplanationLanguage) => {
    await updateAiExplanationLanguage(value);
    await refresh();
  };
  return (
    <Tooltip title={he.aiExplanationLanguageHelper} placement="bottom-end">
      <Box dir="rtl" sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 2.5 }}>
        <TranslateIcon fontSize="small" sx={{ color: brand.violet600 }} />
        <Typography variant="body2" fontWeight={700}>
          {he.studentAiLanguageInline}
        </Typography>
        <TextField select size="small" value={user?.ai_explanation_language ?? "he"} onChange={(e) => change(e.target.value as ExplanationLanguage)} sx={{ minWidth: 120 }} aria-label={he.aiExplanationLanguage}>
          {OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Tooltip>
  );
}
