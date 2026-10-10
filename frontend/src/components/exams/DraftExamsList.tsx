import { useEffect, useState } from "react";
import { Box, Button, Skeleton } from "@mui/material";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import { ExamActionButtons, ExamEditLink } from "../ExamActionButtons";
import EmptyState from "../ui/EmptyState";
import StatusChip from "../ui/StatusChip";
import { api, formatScopeSummary, type CatalogCourse, type Exam } from "../../api/client";
import { he } from "../../i18n/he";
import { filterTemplates, hasActiveFilters, type ExamFilters } from "../../utils/examFilters";
import ExamListCard from "./ExamListCard";

type DraftExamsListProps = {
  catalogs: CatalogCourse[];
  filters: ExamFilters;
  refreshKey: number;
  onActivate: (exam: Exam) => void;
  onError: (message: string) => void;
  onChanged: () => void;
  onCreate: () => void;
};

type TemplateRow = { exam: Exam; title: string; catalogName: string };

async function fetchTemplates(catalogs: CatalogCourse[]): Promise<TemplateRow[]> {
  const lists = await Promise.all(catalogs.map((c) => api<Exam[]>(`/api/exams/catalog/${c.id}`)));
  return catalogs.flatMap((c, i) => lists[i].map((exam) => ({ exam, title: exam.title, catalogName: c.name })));
}

function useTemplates(catalogs: CatalogCourse[], refreshKey: number, onError: (m: string) => void) {
  const [rows, setRows] = useState<TemplateRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetchTemplates(catalogs)
      .then((next) => alive && setRows(next))
      .catch(() => alive && onError(he.errorGeneric));
    return () => {
      alive = false;
    };
  }, [catalogs, refreshKey, onError]);
  return rows;
}

function TemplateCard({ row, onActivate, onChanged, onError }: {
  row: TemplateRow;
  onActivate: (exam: Exam) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const { exam } = row;
  const meta = `${row.catalogName} · ${he.examsQuestionsLabel(exam.question_count)} · ${formatScopeSummary(exam)}`;
  return (
    <ExamListCard
      title={exam.title}
      chip={exam.is_tirgoul ? <StatusChip label={he.tirgoulChip} tone="info" /> : <StatusChip label={he.examDraftStatus} tone="neutral" />}
      meta={meta}
      tone={exam.is_tirgoul ? "info" : "neutral"}
      actions={
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0, flexWrap: "wrap" }}>
          <ExamEditLink examId={exam.id} viewOnly={exam.can_delete === false} />
          <ExamActionButtons exam={exam} onChanged={onChanged} onError={onError} />
          {!exam.is_tirgoul && (
            <Button size="small" variant="contained" onClick={() => onActivate(exam)}>
              {he.activateExam}
            </Button>
          )}
        </Box>
      }
    />
  );
}

/** Tous les examens du prof non encore liés à un groupe, prêts à être activés. */
export default function DraftExamsList({ catalogs, filters, refreshKey, onActivate, onError, onChanged, onCreate }: DraftExamsListProps) {
  const loaded = useTemplates(catalogs, refreshKey, onError);
  if (loaded === null) return <Skeleton variant="rounded" height={96} />;
  const rows = filterTemplates(loaded, filters);
  if (rows.length > 0) {
    return (
      <>
        {rows.map((row) => (
          <TemplateCard key={row.exam.id} row={row} onActivate={onActivate} onChanged={onChanged} onError={onError} />
        ))}
      </>
    );
  }
  if (hasActiveFilters(filters)) return <EmptyState title={he.examsFilterNoResults} />;
  return (
    <EmptyState
      title={he.examsDraftsEmptyTitle}
      description={he.examsDraftsEmptyHint}
      icon={<NoteAddOutlinedIcon />}
      action={<Button variant="contained" onClick={onCreate}>{he.createExam}</Button>}
    />
  );
}
