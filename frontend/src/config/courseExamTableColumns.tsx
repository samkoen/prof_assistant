import { Box, Chip, Typography, alpha, type SxProps, type Theme } from "@mui/material";
import type { DataListColumnDef } from "../components/DataListTable/types";
import StudentVisibilityIcon from "../components/exams/StudentVisibilityIcon";
import HebrewCountPhrase from "../components/ui/HebrewCountPhrase";
import type { Exam, ExamSession } from "../api/client";
import { he } from "../i18n/he";
import {
  examSessionDisplayIso,
  formatExamDateTime,
} from "../utils/examListSort";
import { examDateSortValue, isVisibleToStudents } from "../utils/examRowVisibility";

export interface CourseExamRow {
  exam: Exam;
  session?: ExamSession;
}

/** Tri initial du tableau : date de la matala, du plus récent au plus ancien. */
export const COURSE_EXAMS_DEFAULT_SORT = { key: "exam_date", order: "desc" } as const;

/** Vert clair : visible par les élèves ; gris : invisible (une seule raison : masquée, brouillon ou non envoyée). */
export function courseExamRowSx(row: CourseExamRow): SxProps<Theme> {
  const visible = isVisibleToStudents(row);
  return {
    backgroundColor: (theme) =>
      visible ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.text.primary, 0.07),
    "&.MuiTableRow-hover:hover": {
      backgroundColor: (theme) =>
        visible ? alpha(theme.palette.success.main, 0.18) : alpha(theme.palette.text.primary, 0.12),
    },
  };
}

function statusProps(row: CourseExamRow) {
  const practice = row.exam.kind === "task" || row.exam.kind === "tirgoul" || row.exam.is_tirgoul;
  if (practice && row.session?.grading_locked) {
    return { color: "warning" as const, label: he.gradingLocked };
  }
  if (practice && row.session?.status !== "active" && row.session?.status !== "closed") {
    return { color: "default" as const, label: he.practiceNotDeployed };
  }
  if (row.exam.kind === "task") {
    return { color: "secondary" as const, label: he.taskChip };
  }
  if (row.exam.is_tirgoul) {
    return { color: "info" as const, label: he.tirgoulChip };
  }
  if (row.session?.status === "active") {
    return { color: "success" as const, label: he.examAlreadyActive };
  }
  if (row.session?.status === "closed") {
    return { color: "default" as const, label: he.examClosed };
  }
  return { color: "warning" as const, label: he.examDraftStatus };
}

export function getCourseExamTableColumns(): DataListColumnDef<CourseExamRow>[] {
  return [
    {
      key: "title",
      label: he.examTitle,
      minWidth: 180,
      getValue: (r) => `${r.exam.title}${r.exam.kind === "task" ? ` · ${he.taskChip}` : r.exam.is_tirgoul ? ` · ${he.tirgoulChip}` : ""}`,
      renderCell: (r) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <StudentVisibilityIcon visible={isVisibleToStudents(r)} />
          <Typography variant="body2" fontWeight={600}>
            {r.exam.title}
            {r.exam.kind === "task" ? ` · ${he.taskChip}` : r.exam.is_tirgoul ? ` · ${he.tirgoulChip}` : ""}
          </Typography>
        </Box>
      ),
    },
    {
      key: "status",
      label: he.status,
      minWidth: 120,
      getValue: (r) => statusProps(r).label,
      renderCell: (r) => {
        const s = statusProps(r);
        return <Chip size="small" color={s.color} label={s.label} />;
      },
    },
    {
      key: "exam_date",
      label: he.examDate,
      minWidth: 150,
      cellDir: "ltr",
      getSortValue: (r) => examDateSortValue(r.session),
      getValue: (r) => {
        const iso = examSessionDisplayIso(r.session);
        return iso ? formatExamDateTime(iso) : he.notSentYet;
      },
      renderCell: (r) => {
        const iso = examSessionDisplayIso(r.session);
        if (iso) return formatExamDateTime(iso);
        return (
          <Typography component="span" dir="rtl" variant="body2" fontWeight={700} color="warning.main">
            {he.notSentYet}
          </Typography>
        );
      },
    },
    {
      key: "question_count",
      label: he.questionsCount,
      minWidth: 140,
      getValue: (r) => String(r.exam.question_count),
      renderCell: (r) => (
        <HebrewCountPhrase label={he.questionsInExam} count={r.exam.question_count} />
      ),
    },
  ];
}
