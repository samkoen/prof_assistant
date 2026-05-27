import type { ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { LtrEmotionIsland } from "./LtrEmotionIsland";

interface ExamEditorSectionAccordionProps {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  /** Direction du contenu (ex. שאלות קיימות en français → ltr) */
  detailsDir?: "ltr" | "rtl";
  children: ReactNode;
}

export default function ExamEditorSectionAccordion({
  title,
  subtitle,
  defaultExpanded = false,
  detailsDir = "rtl",
  children,
}: ExamEditorSectionAccordionProps) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{
        mb: 2,
        "&:before": { display: "none" },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} dir="rtl">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="h6" component="span" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              ({subtitle})
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails dir={detailsDir}>
        {detailsDir === "ltr" ? <LtrEmotionIsland>{children}</LtrEmotionIsland> : children}
      </AccordionDetails>
    </Accordion>
  );
}
