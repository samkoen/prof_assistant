import {
  Box,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GeminiQuestionTypesField from "./GeminiQuestionTypesField";
import type {
  GeminiQuestionSeriesDraft,
  GeminiSeriesLanguage,
  GeminiSeriesLevel,
} from "../types/geminiQuestionSeries";
import { GEMINI_SERIES_LANGUAGES, GEMINI_SERIES_LEVELS } from "../types/geminiQuestionSeries";
import { hebrewActionsLeftSx, hebrewAlignRightSx, hebrewCardRowSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

const LEVEL_LABELS: Record<GeminiSeriesLevel, string> = {
  easy: he.geminiLevelEasy,
  medium: he.geminiLevelMedium,
  hard: he.geminiLevelHard,
};

const LANGUAGE_LABELS: Record<GeminiSeriesLanguage, string> = {
  he: he.geminiLangHebrew,
  fr: he.geminiLangFrench,
  en: he.geminiLangEnglish,
  ru: he.geminiLangRussian,
};

interface GeminiQuestionSeriesCardProps {
  index: number;
  series: GeminiQuestionSeriesDraft;
  canRemove: boolean;
  disabled?: boolean;
  onChange: (series: GeminiQuestionSeriesDraft) => void;
  onRemove: () => void;
}

export default function GeminiQuestionSeriesCard({
  index,
  series,
  canRemove,
  disabled = false,
  onChange,
  onRemove,
}: GeminiQuestionSeriesCardProps) {
  const patch = (partial: Partial<GeminiQuestionSeriesDraft>) => {
    onChange({ ...series, ...partial });
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ ...hebrewCardRowSx, py: 0, mb: 2 }}>
          <Box sx={hebrewActionsLeftSx}>
            {canRemove && (
              <IconButton
                size="small"
                color="error"
                onClick={onRemove}
                disabled={disabled}
                aria-label={he.geminiRemoveSeries}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ ...hebrewAlignRightSx, order: 2, flex: 1 }}>
            {he.geminiSeriesLabel} {index + 1}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={he.geminiSeriesInstructions}
            value={series.instructions}
            onChange={(e) => patch({ instructions: e.target.value })}
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            dir="rtl"
            disabled={disabled}
            required
            placeholder={he.geminiSeriesInstructions}
          />
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "flex-start",
            }}
          >
            <TextField
              label={he.geminiSeriesQuestionCount}
              type="number"
              size="small"
              value={series.questionCount}
              onChange={(e) => {
                const n = Math.max(1, Math.min(50, Number(e.target.value) || 1));
                patch({ questionCount: n });
              }}
              inputProps={{ min: 1, max: 50 }}
              dir="ltr"
              disabled={disabled}
              required
              sx={{ width: { xs: "100%", sm: 96 }, flexShrink: 0 }}
            />
            <TextField
              select
              label={he.geminiSeriesLevel}
              size="small"
              value={series.level}
              onChange={(e) => patch({ level: e.target.value as GeminiSeriesLevel })}
              dir="rtl"
              disabled={disabled}
              sx={{ width: { xs: "100%", sm: 128 }, flexShrink: 0 }}
            >
              {GEMINI_SERIES_LEVELS.map((level) => (
                <MenuItem key={level} value={level}>
                  {LEVEL_LABELS[level]}
                </MenuItem>
              ))}
            </TextField>
            <Box
              dir="rtl"
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "flex-start",
                flex: { xs: "1 1 100%", sm: "1 1 auto" },
                minWidth: 0,
              }}
            >
              <TextField
                select
                label={he.geminiSeriesLanguage}
                size="small"
                value={series.language}
                onChange={(e) => patch({ language: e.target.value as GeminiSeriesLanguage })}
                dir="rtl"
                disabled={disabled}
                sx={{ width: { xs: "100%", sm: 112 }, flexShrink: 0 }}
              >
                {GEMINI_SERIES_LANGUAGES.map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang]}
                  </MenuItem>
                ))}
              </TextField>
              <GeminiQuestionTypesField
                value={series.questionTypes}
                onChange={(questionTypes) => patch({ questionTypes })}
                disabled={disabled}
                compact
              />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
