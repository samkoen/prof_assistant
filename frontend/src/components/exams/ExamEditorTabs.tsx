import { Badge, Tab, Tabs } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import { he } from "../../i18n/he";
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
    <Tabs
      value={value}
      onChange={(_, v: EditorTab) => onChange(v)}
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{ mb: 2.5, borderBottom: 1, borderColor: "divider" }}
    >
      <Tab
        value="questions"
        icon={<Badge badgeContent={questionCount} color="primary" max={999} showZero={false}><QuizOutlinedIcon fontSize="small" /></Badge>}
        iconPosition="start"
        label={stepsMode ? he.taskStepsTab : he.examTabQuestions}
      />
      {canAdd && <Tab value="add" icon={<AddCircleOutlineIcon fontSize="small" />} iconPosition="start" label={he.examTabAdd} />}
      <Tab value="settings" icon={<TuneIcon fontSize="small" />} iconPosition="start" label={he.examTabSettings} />
    </Tabs>
  );
}
