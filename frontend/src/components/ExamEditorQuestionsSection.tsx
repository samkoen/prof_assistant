import type { ReactNode } from "react";
import { Box, Button, Chip, IconButton, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { ExamQuestionReadView } from "./ExamQuestionReadView";
import { examQuestionLtrSx } from "./examQuestionLtrStyles";
import DisabledActionTooltip from "./DisabledActionTooltip";
import ExamSectionHeader from "./student/exam/ExamSectionHeader";
import type { ExamDetail, ExamSection, Question } from "../api/client";
import { effectiveRequired, groupMaxPoints, groupQuestionsBySection, type QuestionGroup } from "../utils/examSections";
import { contentDirForExam } from "../utils/examQuestionsLanguage";
import { questionsFingerprint } from "../utils/examEditorChanges";
import { he } from "../i18n/he";

interface ExamEditorQuestionsSectionProps {
  exam: ExamDetail;
  reordering: boolean;
  deletingQuestionId: number | null;
  onMove: (questionId: number, direction: -1 | 1) => void;
  onEdit: (q: Question) => void;
  onDelete: (q: Question) => void;
  /** Change la partie d'une question (null = hors partie). */
  onAssign?: (questionId: number, sectionId: number | null) => void;
  onAdd?: () => void;
}

const NO_SECTION = "none";

/** Choix rapide de la partie d'une question, sans ouvrir le dialogue d'édition. */
function SectionPicker({ question, sections, onAssign }: { question: Question; sections: ExamSection[]; onAssign: (questionId: number, sectionId: number | null) => void }) {
  return (
    <Box dir="rtl" sx={{ mt: 1, textAlign: "right" }}>
      <TextField
        select
        size="small"
        label={he.examSectionField}
        value={question.section_id ?? NO_SECTION}
        onChange={(e) => onAssign(question.id, e.target.value === NO_SECTION ? null : Number(e.target.value))}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value={NO_SECTION}>{he.examSectionNone}</MenuItem>
        {sections.map((s) => (
          <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>
        ))}
      </TextField>
    </Box>
  );
}

type GroupBlockProps = Omit<ExamEditorQuestionsSectionProps, "onAdd"> & {
  group: QuestionGroup<Question>;
  contentDir: "ltr" | "rtl";
};

/** Une partie du sujet : en-tête (titre, règle, points) puis ses questions, réordonnables entre elles. */
function QuestionGroupBlock({ exam, group, contentDir, reordering, deletingQuestionId, onMove, onEdit, onDelete, onAssign }: GroupBlockProps) {
  const sections = exam.sections ?? [];
  return (
    <>
      {group.section && (
        <ExamSectionHeader
          section={group.section}
          questionCount={group.items.length}
          required={effectiveRequired(group.section, group.items.length)}
          points={groupMaxPoints(group)}
        />
      )}
      {group.items.map(({ question: q, index }, position) => (
        <QuestionRow
          key={`${q.id}-${questionsFingerprint([q])}`}
          contentDir={contentDir}
          actions={
            exam.is_editable ? (
              <QuestionActions
                index={position}
                total={group.items.length}
                reordering={reordering}
                deleting={deletingQuestionId === q.id}
                onMove={(_position, direction) => onMove(q.id, direction)}
                onEdit={() => onEdit(q)}
                onDelete={() => onDelete(q)}
              />
            ) : null
          }
        >
          <ExamQuestionReadView
            index={index}
            text={q.text}
            imageUrl={q.image_url}
            questionType={q.question_type}
            points={q.points}
            options={q.options}
            contentDir={contentDir}
          />
          {exam.is_editable && onAssign && sections.length > 0 && (
            <SectionPicker question={q} sections={sections} onAssign={onAssign} />
          )}
        </QuestionRow>
      ))}
    </>
  );
}

export default function ExamEditorQuestionsSection({
  exam,
  reordering,
  deletingQuestionId,
  onMove,
  onEdit,
  onDelete,
  onAssign,
  onAdd,
}: ExamEditorQuestionsSectionProps) {
  const contentDir = contentDirForExam(exam.questions, exam.questions_language);
  const addButton =
    exam.is_editable && onAdd ? (
      <Box dir="rtl" sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={onAdd}>
          {he.addQuestionsSection}
        </Button>
      </Box>
    ) : null;

  if (exam.questions.length === 0) {
    return (
      <Box dir={contentDir} sx={contentDir === "ltr" ? examQuestionLtrSx : undefined}>
        {addButton}
        <Typography variant="body2" color="text.secondary" dir="rtl" sx={{ textAlign: "right" }}>
          {he.noQuestionsInExam}
        </Typography>
      </Box>
    );
  }

  return (
    <Box dir={contentDir} sx={contentDir === "ltr" ? examQuestionLtrSx : undefined}>
      {addButton}
      {!exam.is_editable && (
        <Chip size="small" color="warning" label={he.examNotEditable} sx={{ mb: 2 }} />
      )}
      {exam.is_editable && exam.questions.length > 1 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, textAlign: contentDir === "ltr" ? "left" : "right" }}
        >
          {he.reorderQuestionsHint}
        </Typography>
      )}
      {groupQuestionsBySection(exam.questions, exam.sections ?? []).map((group) => (
        <QuestionGroupBlock
          key={group.section?.id ?? NO_SECTION}
          exam={exam}
          group={group}
          contentDir={contentDir}
          reordering={reordering}
          deletingQuestionId={deletingQuestionId}
          onMove={onMove}
          onEdit={onEdit}
          onDelete={onDelete}
          onAssign={onAssign}
        />
      ))}
    </Box>
  );
}

function QuestionRow({
  children,
  actions,
  contentDir,
}: {
  children: ReactNode;
  actions: ReactNode;
  contentDir: "ltr" | "rtl";
}) {
  const ltr = contentDir === "ltr";
  return (
    <Box
      dir={contentDir}
      sx={{
        ...(ltr ? examQuestionLtrSx : {}),
        mb: 2,
        p: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: 1,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 1,
        width: "100%",
      }}
    >
      <Box flex={1} minWidth={0} sx={ltr ? examQuestionLtrSx : { textAlign: "right", width: "100%" }}>
        {children}
      </Box>
      {actions}
    </Box>
  );
}

function QuestionActions({
  index,
  total,
  reordering,
  deleting,
  onMove,
  onEdit,
  onDelete,
}: {
  index: number;
  total: number;
  reordering: boolean;
  deleting: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      {total > 1 && (
        <>
          <DisabledActionTooltip
            disabled={index === 0 || reordering}
            disabledReason={index === 0 ? he.moveUpDisabled : undefined}
          >
            <IconButton size="small" onClick={() => onMove(index, -1)} aria-label={he.moveQuestionUp}>
              <KeyboardArrowUpIcon fontSize="small" />
            </IconButton>
          </DisabledActionTooltip>
          <DisabledActionTooltip
            disabled={index === total - 1 || reordering}
            disabledReason={index === total - 1 ? he.moveDownDisabled : undefined}
          >
            <IconButton size="small" onClick={() => onMove(index, 1)} aria-label={he.moveQuestionDown}>
              <KeyboardArrowDownIcon fontSize="small" />
            </IconButton>
          </DisabledActionTooltip>
        </>
      )}
      <Tooltip title={he.editQuestion}>
        <IconButton size="small" color="primary" onClick={onEdit} aria-label={he.editQuestion}>
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={he.deleteQuestion}>
        <IconButton size="small" color="error" disabled={deleting} onClick={onDelete} aria-label={he.deleteQuestion}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
