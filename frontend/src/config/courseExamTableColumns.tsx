import { Chip, Typography } from "@mui/material";
import type { DataListColumnDef } from "../components/DataListTable/types";
import HebrewCountPhrase from "../components/ui/HebrewCountPhrase";
import type { Exam, ExamSession } from "../api/client";
import { he } from "../i18n/he";
import {
  examSessionDisplayIso,
  formatExamDateTime,
} from "../utils/examListSort";

export interface CourseExamRow {
  exam: Exam;
  session?: ExamSession;
}

function statusProps(row: CourseExamRow) {
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
      getValue: (r) => (r.exam.is_tirgoul ? `${r.exam.title} · ${he.tirgoulChip}` : r.exam.title),
      renderCell: (r) => (
        <Typography variant="body2" fontWeight={600}>
          {r.exam.title}
          {r.exam.is_tirgoul ? ` · ${he.tirgoulChip}` : ""}
        </Typography>
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
      getValue: (r) => {
        const iso = examSessionDisplayIso(r.session);
        return iso ? formatExamDateTime(iso) : "";
      },
      renderCell: (r) => {
        const iso = examSessionDisplayIso(r.session);
        return iso ? formatExamDateTime(iso) : "—";
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
