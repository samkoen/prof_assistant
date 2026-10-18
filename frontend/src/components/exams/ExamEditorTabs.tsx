import { Badge, Box, Tab, Tabs } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import { he } from "../../i18n/he";
import { brand, softCardShadow } from "../../theme/brand";
import type { EditorTab } from "../../utils/examEditorTab";

type ExamEditorTabsProps = {
  value: EditorTab;
  questionCount: number;
  canAdd: boolean;
  stepsMode?: boolean;
  onChange: (tab: EditorTab) => void;
};

/** Onglets de l'éditeur : questions, ajout (manuel / AI / collage) et réglages. */
export default function ExamEditorTabs({ value, questionCount, canAdd, stepsMode, onChange }: ExamEditorTabsProps) {
  return (
    <Box sx={{ mb: 2.5, borderRadius: 3, bgcolor: "background.paper", boxShadow: softCardShadow, border: `1px solid ${alpha(brand.violet600, 0.08)}` }}>
      <Tabs value={value} onChange={(_, v: EditorTab) => onChange(v)} variant="scrollable" scrollButtons="auto" dir="rtl" sx={{ px: 1 }}>
        <Tab
          value="questions"
          icon={<Badge badgeContent={questionCount} color="primary" max={999} showZero={false}><QuizOutlinedIcon /></Badge>}
          iconPosition="start"
          label={stepsMode ? he.taskStepsTab : he.examTabQuestions}
        />
        {canAdd && <Tab value="add" icon={<AutoAwesomeIcon />} iconPosition="start" label={he.examTabAdd} />}
        <Tab value="settings" icon={<TuneIcon />} iconPosition="start" label={he.examTabSettings} />
      </Tabs>
    </Box>
  );
}
