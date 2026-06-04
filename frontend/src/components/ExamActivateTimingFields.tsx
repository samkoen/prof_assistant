import { Box, Checkbox, FormControlLabel, TextField, Typography } from "@mui/material";
import { he } from "../i18n/he";
import { hebrewFormFieldRowSx, hebrewFormFieldSx } from "../styles/hebrewAlign";
import type { ExamTimingForm } from "../utils/examActivateTiming";

type ExamActivateTimingFieldsProps = {
  value: ExamTimingForm;
  onChange: (next: ExamTimingForm) => void;
};

export default function ExamActivateTimingFields({
  value,
  onChange,
}: ExamActivateTimingFieldsProps) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textAlign: "right" }}>
        {he.examTimingSection}
      </Typography>
      <Box sx={hebrewFormFieldRowSx}>
        <TextField
          size="small"
          type="number"
          label={he.examDurationMinutes}
          value={value.durationMinutes}
          onChange={(e) => onChange({ ...value, durationMinutes: e.target.value })}
          inputProps={{ min: 1, max: 300, dir: "ltr" }}
          sx={hebrewFormFieldSx}
        />
        <TextField
          size="small"
          type="number"
          label={he.examWarningMinutes}
          value={value.warningMinutes}
          onChange={(e) => onChange({ ...value, warningMinutes: e.target.value })}
          inputProps={{ min: 1, max: 60, dir: "ltr" }}
          sx={hebrewFormFieldSx}
        />
      </Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={value.autoSubmitOnTimeout}
            onChange={(e) => onChange({ ...value, autoSubmitOnTimeout: e.target.checked })}
          />
        }
        label={he.autoSubmitOnTimeout}
        sx={{ display: "block", textAlign: "right", mr: 0 }}
      />
    </Box>
  );
}
