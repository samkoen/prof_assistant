import { Box, Button, Slide, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DisabledActionTooltip from "../DisabledActionTooltip";
import { MOBILE_NAV_HEIGHT } from "../shell/MobileBottomNav";
import { he } from "../../i18n/he";
import { brand, surface } from "../../theme/brand";

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
  position: "fixed",
  zIndex: 1050,
  insetInline: { xs: 12, sm: 24 },
  bottom: { xs: `calc(${MOBILE_NAV_HEIGHT + 12}px + env(safe-area-inset-bottom))`, sm: 24 },
  maxWidth: 720,
  mx: "auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1.5,
  flexWrap: "wrap",
  px: 2,
  py: 1.25,
  borderRadius: 2.5,
  bgcolor: brand.slate900,
  color: brand.white,
  boxShadow: "0 12px 32px rgba(16, 24, 40, 0.28)",
} as const;

/**
 * Barre d'enregistrement : n'apparaît que lorsqu'il y a des changements non enregistrés,
 * collée en bas de l'écran (au-dessus de la navigation mobile).
 */
export default function ExamEditorSaveBar(props: ExamEditorSaveBarProps) {
  const { hasChanges, titleValid, saving, discarding, onDiscard, onSave } = props;
  const reason = !titleValid ? he.examTitleRequired : undefined;
  return (
    <Slide direction="up" in={hasChanges || saving} mountOnEnter unmountOnExit>
      <Box sx={barSx} role="region" aria-live="polite" aria-label={he.examUnsavedChanges}>
        <Typography variant="body2" fontWeight={600}>{he.examUnsavedChanges}</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onDiscard} disabled={discarding} sx={{ color: surface.border }}>
            {discarding ? he.loading : he.cancel}
          </Button>
          <DisabledActionTooltip disabled={saving || discarding || !titleValid} disabledReason={reason}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>
              {saving ? he.loading : he.saveExam}
            </Button>
          </DisabledActionTooltip>
        </Box>
      </Box>
    </Slide>
  );
}
