import { Box, Button, TextField, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ExamScopeEditor from "../ExamScopeEditor";
import type { ExamDetail } from "../../api/client";
import { he } from "../../i18n/he";
import { softCardShadow } from "../../theme/brand";

type ExamEditorSettingsProps = {
  exam: ExamDetail;
  titleDraft: string;
  titleChanged: boolean;
  titleValid: boolean;
  savingTitle: boolean;
  onTitleChange: (value: string) => void;
  onSaveTitle: () => void;
  onExamUpdated: (patch: Partial<ExamDetail>) => void;
  onError: (message: string) => void;
};

/** Onglet « הגדרות » : titre + portée (année, semestre, groupe). */
export default function ExamEditorSettings(props: ExamEditorSettingsProps) {
  const { exam, titleDraft, titleChanged, titleValid, savingTitle } = props;
  const showSave = titleChanged && titleValid;
  return (
    <Box dir="rtl" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "background.paper", boxShadow: softCardShadow }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        {he.examSettings}
      </Typography>
      <TextField
        label={he.examTitle}
        value={titleDraft}
        onChange={(e) => props.onTitleChange(e.target.value)}
        fullWidth
        dir="rtl"
        inputProps={{ maxLength: 255 }}
        sx={{ mb: showSave ? 2 : 3 }}
      />
      {showSave && (
        <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={props.onSaveTitle} disabled={savingTitle} sx={{ mb: 3 }}>
          {savingTitle ? he.loading : he.saveExamTitle}
        </Button>
      )}
      <ExamScopeEditor exam={exam} editable={exam.is_editable} embedded onSaved={props.onExamUpdated} onError={props.onError} />
    </Box>
  );
}
