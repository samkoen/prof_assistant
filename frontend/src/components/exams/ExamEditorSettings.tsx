import { Box, Divider, Drawer, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExamScopeEditor from "../ExamScopeEditor";
import ExamAiTutorSetting from "./ExamAiTutorSetting";
import type { ExamDetail } from "../../api/client";
import { he } from "../../i18n/he";

type ExamEditorSettingsProps = {
  open: boolean;
  exam: ExamDetail;
  onClose: () => void;
  onExamUpdated: (patch: Partial<ExamDetail>) => void;
  onError: (message: string) => void;
};

/** Panneau latéral « הגדרות » : tuteur AI et portée. Le titre se modifie directement dans l'en-tête. */
export default function ExamEditorSettings({ open, exam, onClose, onExamUpdated, onError }: ExamEditorSettingsProps) {
  return (
    // Avec le thème RTL + stylis-plugin-rtl de l'app, anchor="right" s'affiche bien à droite (côté de début en hébreu).
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}>
      <Box dir="rtl" sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">{he.examSettings}</Typography>
          <IconButton onClick={onClose} aria-label={he.addQuestionsClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {exam.kind !== "task" && (
          <>
            <ExamAiTutorSetting exam={exam} onSaved={onExamUpdated} onError={onError} />
            <Divider sx={{ my: 3 }} />
          </>
        )}
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          {he.examScope}
        </Typography>
        <ExamScopeEditor exam={exam} editable={exam.is_editable} embedded onSaved={onExamUpdated} onError={onError} />
      </Box>
    </Drawer>
  );
}
