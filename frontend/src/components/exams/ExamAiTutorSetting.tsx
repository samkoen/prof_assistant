import { useState } from "react";
import { Box, FormControlLabel, Switch, Typography } from "@mui/material";
import { api, ApiError, type Exam } from "../../api/client";
import { he } from "../../i18n/he";

interface ExamAiTutorSettingProps {
  exam: Exam;
  onSaved: (patch: Partial<Exam>) => void;
  onError: (message: string) => void;
}

/** Réglage par מטלה : tuteur IA pour les élèves après la correction (modifiable même si la מטלה est active). */
export default function ExamAiTutorSetting({ exam, onSaved, onError }: ExamAiTutorSettingProps) {
  const [saving, setSaving] = useState(false);
  const enabled = exam.ai_tutor_enabled !== false;
  const toggle = async (next: boolean) => {
    setSaving(true);
    onError("");
    try {
      const updated = await api<Exam>(`/api/exams/${exam.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ai_tutor_enabled: next }),
      });
      onSaved({ ai_tutor_enabled: updated.ai_tutor_enabled });
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Box dir="rtl" sx={{ mb: 3 }}>
      <FormControlLabel
        control={<Switch checked={enabled} disabled={saving} onChange={(e) => void toggle(e.target.checked)} />}
        label={he.examAiTutorSetting}
        sx={{ mx: 0 }}
      />
      <Typography variant="caption" color="text.secondary" display="block">
        {he.examAiTutorSettingHelper}
      </Typography>
    </Box>
  );
}
