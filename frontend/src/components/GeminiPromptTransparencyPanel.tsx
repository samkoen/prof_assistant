import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { GeminiSourcePreviewItem } from "../types/geminiGenerationPreview";
import { hebrewAccordionSx, hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

type Props = {
  instructions: string[];
  sources: GeminiSourcePreviewItem[];
  defaultExpanded?: boolean;
};

function sourceTypeLabel(type: GeminiSourcePreviewItem["source_type"]): string {
  return type === "exercises_file" ? he.geminiSourceExercises : he.geminiSourceCourse;
}

function sourceRoles(source: GeminiSourcePreviewItem): string[] {
  const roles: string[] = [];
  if (source.use_as_style) {
    roles.push(he.geminiSourceUseStyle);
  }
  if (source.use_as_content) {
    roles.push(he.geminiSourceUseContent);
  }
  return roles;
}

function InstructionBlock({ text, index }: { text: string; index: number }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block" sx={hebrewAlignRightSx}>
        {he.geminiSeriesLabel} {index + 1}
      </Typography>
      <Typography
        variant="body2"
        component="pre"
        dir="rtl"
        sx={{
          ...hebrewAlignRightSx,
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          m: 0,
          mt: 0.5,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

function SourceBlock({ source }: { source: GeminiSourcePreviewItem }) {
  const roles = sourceRoles(source);
  return (
    <Box
      sx={{
        mb: 2,
        pb: 2,
        borderBottom: 1,
        borderColor: "divider",
        "&:last-child": { mb: 0, pb: 0, border: 0 },
      }}
    >
      <Typography variant="subtitle2" sx={hebrewAlignRightSx}>
        {source.original_filename}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", justifyContent: "flex-end", my: 0.5 }}>
        <Chip size="small" label={sourceTypeLabel(source.source_type)} />
        {roles.map((role) => (
          <Chip key={role} size="small" variant="outlined" label={role} />
        ))}
      </Box>
      <Typography
        variant="caption"
        component="pre"
        dir="rtl"
        color="text.secondary"
        sx={{
          ...hebrewAlignRightSx,
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          m: 0,
          display: "block",
        }}
      >
        {source.text_preview}
      </Typography>
    </Box>
  );
}

export default function GeminiPromptTransparencyPanel({
  instructions,
  sources,
  defaultExpanded = false,
}: Props) {
  return (
    <Accordion defaultExpanded={defaultExpanded} sx={{ ...hebrewAccordionSx, mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">{he.geminiAiReceivedTitle}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box dir="rtl" sx={{ width: "100%" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 1, ...hebrewAlignRightSx }}
          >
            {he.geminiAiReceivedInstructions}
          </Typography>
          {instructions.map((text, index) => (
            <InstructionBlock key={`${index}-${text.slice(0, 24)}`} text={text} index={index} />
          ))}
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 1, ...hebrewAlignRightSx }}
          >
            {he.geminiAiReceivedSources}
          </Typography>
          {sources.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={hebrewAlignRightSx}>
              {he.geminiSourcesEmpty}
            </Typography>
          ) : (
            sources.map((source) => <SourceBlock key={source.id} source={source} />)
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
