import type { ReactNode } from "react";
import { Box, Button, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { ExamQuestionReadView } from "./ExamQuestionReadView";
import { examQuestionLtrSx } from "./examQuestionLtrStyles";
import DisabledActionTooltip from "./DisabledActionTooltip";
import type { ExamDetail, Question } from "../api/client";
import { contentDirForExam } from "../utils/examQuestionsLanguage";
import { he } from "../i18n/he";

interface ExamEditorQuestionsSectionProps {
  exam: ExamDetail;
  reordering: boolean;
  deletingQuestionId: number | null;
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: (q: Question) => void;
  onDelete: (q: Question) => void;
  onAdd?: () => void;
}

export default function ExamEditorQuestionsSection({
  exam,
  reordering,
  deletingQuestionId,
  onMove,
  onEdit,
  onDelete,
  onAdd,
}: ExamEditorQuestionsSectionProps) {
  const contentDir = contentDirForExam(exam.questions, exam.questions_language);
  const addButton =
    exam.is_editable && onAdd ? (
      <Box dir="rtl" sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={onAdd}>
          {he.addQuestion}
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
      {exam.questions.map((q, i) => (
        <QuestionRow
          key={q.id}
          contentDir={contentDir}
          actions={
            exam.is_editable ? (
              <QuestionActions
                index={i}
                total={exam.questions.length}
                reordering={reordering}
                deleting={deletingQuestionId === q.id}
                onMove={onMove}
                onEdit={() => onEdit(q)}
                onDelete={() => onDelete(q)}
              />
            ) : null
          }
        >
          <ExamQuestionReadView
            index={i + 1}
            text={q.text}
            imageUrl={q.image_url}
            questionType={q.question_type}
            points={q.points}
            options={q.options}
            contentDir={contentDir}
          />
        </QuestionRow>
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
      <Box flex={1} minWidth={0} sx={ltr ? examQuestionLtrSx : undefined}>
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
