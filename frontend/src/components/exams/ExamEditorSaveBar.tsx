import { alpha, Box, Button } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DisabledActionTooltip from "../DisabledActionTooltip";
import StatusChip from "../ui/StatusChip";
import { he } from "../../i18n/he";
import { brand } from "../../theme/brand";

type ExamEditorSaveBarProps = {
  hasChanges: boolean;
  titleValid: boolean;
  saving: boolean;
  discarding: boolean;
  questionCount: number;
  onDiscard: () => void;
  onSave: () => void;
};

const barSx = {
  position: "sticky",
  top: 60,
  zIndex: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1.5,
  flexWrap: "wrap",
  mb: 2.5,
  px: 2,
  py: 1.25,
  borderRadius: 3,
  bgcolor: alpha(brand.white, 0.94),
  backdropFilter: "blur(10px)",
  border: `1px solid ${alpha(brand.violet600, 0.14)}`,
  boxShadow: `0 6px 18px ${alpha(brand.violet900, 0.08)}`,
} as const;

function SaveStatus({ hasChanges, questionCount }: Pick<ExamEditorSaveBarProps, "hasChanges" | "questionCount">) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
      {hasChanges ? <StatusChip label={he.examUnsavedChanges} tone="warning" /> : <StatusChip label={he.examAllChangesSaved} tone="success" />}
      <StatusChip label={questionCount > 0 ? he.examsQuestionsLabel(questionCount) : he.examQuestionsEmptyBadge} tone={questionCount > 0 ? "violet" : "neutral"} />
    </Box>
  );
}

/** Barre d'enregistrement toujours visible : état des changements + annuler / enregistrer. */
export default function ExamEditorSaveBar(props: ExamEditorSaveBarProps) {
  const { hasChanges, titleValid, saving, discarding, onDiscard, onSave } = props;
  const reason = !titleValid ? he.examTitleRequired : !hasChanges ? he.noChangesToSave : undefined;
  return (
    <Box sx={barSx}>
      <SaveStatus hasChanges={hasChanges} questionCount={props.questionCount} />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button variant="outlined" onClick={onDiscard} disabled={!hasChanges || discarding}>
          {discarding ? he.loading : he.cancel}
        </Button>
        <DisabledActionTooltip disabled={saving || discarding || !titleValid || !hasChanges} disabledReason={reason}>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>
            {saving ? he.loading : he.saveExam}
          </Button>
        </DisabledActionTooltip>
      </Box>
    </Box>
  );
}
