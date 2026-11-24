import { useEffect, useState } from "react";
import { Box, Button, Card, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import type { ExamDetail, ExamSection } from "../../api/client";
import type { ExamStructure } from "../../hooks/examEditor/useExamStructure";
import { he } from "../../i18n/he";
import { effectiveRequired, examMaxPoints } from "../../utils/examSections";
import ConfirmDialog from "../ui/ConfirmDialog";
import StatusChip from "../ui/StatusChip";
import ExamSectionDialog from "./ExamSectionDialog";

type PanelProps = { exam: ExamDetail; structure: ExamStructure };

function sectionQuestionCount(exam: ExamDetail, sectionId: number): number {
  return exam.questions.filter((q) => q.section_id === sectionId).length;
}

function InstructionsFields({ exam, structure }: PanelProps) {
  const [text, setText] = useState(exam.description ?? "");
  const [cap, setCap] = useState(exam.score_cap != null ? String(exam.score_cap) : "");
  useEffect(() => setText(exam.description ?? ""), [exam.description]);
  useEffect(() => setCap(exam.score_cap != null ? String(exam.score_cap) : ""), [exam.score_cap]);
  const total = examMaxPoints(exam.questions, exam.sections ?? []);
  return (
    <>
      <TextField
        label={he.examInstructionsLabel}
        placeholder={he.examInstructionsPlaceholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => structure.saveInstructions(text)}
        disabled={!exam.is_editable}
        multiline
        minRows={3}
        fullWidth
      />
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mt: 2, flexWrap: "wrap" }}>
        <TextField
          label={he.examScoreCapLabel}
          type="number"
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          onBlur={() => structure.saveScoreCap(cap)}
          disabled={!exam.is_editable}
          helperText={he.examScoreCapHint}
          inputProps={{ min: 1 }}
          sx={{ width: 260 }}
        />
        <Typography variant="body2" fontWeight={700} sx={{ mt: 2 }}>{he.examTotalPointsNote(total)}</Typography>
      </Box>
    </>
  );
}

type SectionRowProps = { exam: ExamDetail; section: ExamSection; onEdit: () => void; onDelete: () => void };

function SectionRow({ exam, section, onEdit, onDelete }: SectionRowProps) {
  const count = sectionQuestionCount(exam, section.id);
  const required = effectiveRequired(section, count);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1, borderBottom: "1px solid", borderColor: "divider", flexWrap: "wrap" }}>
      <Typography fontWeight={700}>{section.title}</Typography>
      <StatusChip label={he.examSectionQuestionCount(count)} tone="neutral" />
      {required != null && <StatusChip label={he.examSectionChooseRule(required, count)} tone="primary" />}
      {section.required_count != null && required == null && (
        <StatusChip label={`${he.examSectionRequiredLabel}: ${section.required_count}`} tone="warning" />
      )}
      {exam.is_editable && (
        <Box sx={{ marginInlineStart: "auto", display: "flex" }}>
          <Tooltip title={he.examSectionEdit}>
            <IconButton size="small" color="primary" onClick={onEdit} aria-label={he.examSectionEdit}><EditOutlinedIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title={he.examSectionDelete}>
            <IconButton size="small" color="error" onClick={onDelete} aria-label={he.examSectionDelete}><DeleteOutlineIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}

function SectionsList({ exam, structure }: PanelProps) {
  const sections = exam.sections ?? [];
  const [dialog, setDialog] = useState<{ open: boolean; section: ExamSection | null }>({ open: false, section: null });
  const [toDelete, setToDelete] = useState<ExamSection | null>(null);
  const close = () => setDialog((prev) => ({ ...prev, open: false }));
  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{he.examSectionsTitle}</Typography>
        {exam.is_editable && (
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setDialog({ open: true, section: null })}>{he.examSectionAdd}</Button>
        )}
      </Box>
      {sections.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{he.examSectionsEmpty}</Typography>}
      {sections.map((section) => (
        <SectionRow key={section.id} exam={exam} section={section} onEdit={() => setDialog({ open: true, section })} onDelete={() => setToDelete(section)} />
      ))}
      <ExamSectionDialog
        open={dialog.open}
        section={dialog.section}
        questionCount={dialog.section ? sectionQuestionCount(exam, dialog.section.id) : 0}
        busy={structure.busy}
        onClose={close}
        onSave={async (input) => {
          if (await structure.saveSection(input, dialog.section?.id ?? null)) close();
        }}
      />
      <ConfirmDialog
        open={toDelete != null}
        title={he.examSectionDelete}
        message={he.examSectionDeleteConfirm}
        detail={toDelete?.title}
        confirmLabel={he.examSectionDelete}
        color="error"
        busy={structure.busy}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete && (await structure.removeSection(toDelete.id))) setToDelete(null);
        }}
      />
    </Box>
  );
}

/** Structure du sujet : consigne affichée en haut, plafond de note et parties (« répondre à N sur M »). */
export default function ExamStructurePanel({ exam, structure }: PanelProps) {
  return (
    <Card variant="outlined" dir="rtl" sx={{ mb: 2, p: { xs: 2, sm: 2.5 }, textAlign: "right" }}>
      <Typography variant="h6" component="h2">{he.examStructureTitle}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{he.examStructureHint}</Typography>
      <InstructionsFields exam={exam} structure={structure} />
      <SectionsList exam={exam} structure={structure} />
    </Card>
  );
}
