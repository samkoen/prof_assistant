import { Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Typography } from "@mui/material";
import StatusChip from "../ui/StatusChip";
import type { StudentExamResult } from "../../api/client";
import { he } from "../../i18n/he";
import { hebrewDataListTableSx } from "../../styles/hebrewAlign";
import type { StatusTone } from "../../theme/brand";
import { formatHiddenDuration } from "../../utils/formatHiddenDuration";
import {
  formatPercent,
  percentOf,
  scoreTone,
  type ResultsSortKey,
  type ResultStatus,
  type SortDirection,
} from "../../utils/resultsStats";

type ResultsTableProps = {
  rows: StudentExamResult[];
  integrity: boolean;
  sortKey: ResultsSortKey;
  direction: SortDirection;
  onSort: (key: ResultsSortKey) => void;
};

const STATUS_VIEW: Record<ResultStatus, { label: string; tone: StatusTone }> = {
  submitted: { label: he.resultSubmitted, tone: "success" },
  in_progress: { label: he.resultInProgress, tone: "warning" },
  not_started: { label: he.resultNotStarted, tone: "neutral" },
};

function formatDateTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("he-IL") : "—";
}

function SortableHead({ label, id, props }: { label: string; id: ResultsSortKey; props: ResultsTableProps }) {
  const active = props.sortKey === id;
  return (
    <TableCell sortDirection={active ? props.direction : false}>
      <TableSortLabel active={active} direction={active ? props.direction : "asc"} onClick={() => props.onSort(id)}>
        {label}
      </TableSortLabel>
    </TableCell>
  );
}

function HeadRow(props: ResultsTableProps) {
  return (
    <TableRow>
      <SortableHead label={he.fullName} id="name" props={props} />
      <TableCell>{he.studentId}</TableCell>
      <TableCell>{he.status}</TableCell>
      <SortableHead label={he.score} id="score" props={props} />
      <SortableHead label={he.submittedAt} id="submitted" props={props} />
      {props.integrity && (
        <>
          <TableCell>{he.integrityTabLeaves}</TableCell>
          <TableCell>{he.integrityHiddenTime}</TableCell>
        </>
      )}
    </TableRow>
  );
}

function ScoreCell({ row }: { row: StudentExamResult }) {
  const percent = percentOf(row);
  if (percent == null) return <>—</>;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <StatusChip label={formatPercent(percent)} tone={scoreTone(percent)} />
      <Typography variant="caption" color="text.secondary" dir="ltr">
        {row.score} / {row.max_score}
      </Typography>
    </Box>
  );
}

function IntegrityCells({ row }: { row: StudentExamResult }) {
  return (
    <>
      <TableCell>{row.focus_loss_count != null ? row.focus_loss_count : he.integrityNotApplicable}</TableCell>
      <TableCell>
        {row.total_hidden_seconds != null ? formatHiddenDuration(row.total_hidden_seconds) : he.integrityNotApplicable}
      </TableCell>
    </>
  );
}

function ResultRow({ row, integrity }: { row: StudentExamResult; integrity: boolean }) {
  const status = STATUS_VIEW[row.status];
  return (
    <TableRow hover>
      <TableCell sx={{ fontWeight: 700 }}>{row.student_name}</TableCell>
      <TableCell>{row.student_number || "—"}</TableCell>
      <TableCell>
        <StatusChip label={status.label} tone={status.tone} />
      </TableCell>
      <TableCell>
        <ScoreCell row={row} />
      </TableCell>
      <TableCell>{formatDateTime(row.submitted_at)}</TableCell>
      {integrity && <IntegrityCells row={row} />}
    </TableRow>
  );
}

/** Tableau des copies : tri par nom / note / date, notes colorées. */
export default function ResultsTable(props: ResultsTableProps) {
  return (
    <Card>
      <TableContainer>
        <Table size="small" dir="rtl" sx={hebrewDataListTableSx}>
          <TableHead>
            <HeadRow {...props} />
          </TableHead>
          <TableBody>
            {props.rows.map((row) => (
              <ResultRow key={row.student_id} row={row} integrity={props.integrity} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
