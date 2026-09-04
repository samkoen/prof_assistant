import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { api, ApiError, type ExamSessionResults } from "../../api/client";
import ExamAnswerKeyDialog from "../../components/ExamAnswerKeyDialog";
import DisabledActionTooltip from "../../components/DisabledActionTooltip";
import { he } from "../../i18n/he";
import { hebrewAlignRightSx } from "../../styles/hebrewAlign";
import { formatHiddenDuration } from "../../utils/formatHiddenDuration";

const statusLabel: Record<ExamSessionResults["results"][0]["status"], string> = {
  not_started: he.resultNotStarted,
  in_progress: he.resultInProgress,
  submitted: he.resultSubmitted,
};

const statusColor: Record<
  ExamSessionResults["results"][0]["status"],
  "default" | "warning" | "success"
> = {
  not_started: "default",
  in_progress: "warning",
  submitted: "success",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("he-IL");
}

export default function TeacherExamResultsPage() {
  const { courseId, sessionId } = useParams<{ courseId: string; sessionId: string }>();
  const sid = Number(sessionId);
  const [data, setData] = useState<ExamSessionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [keyOpen, setKeyOpen] = useState(false);

  const backTo = `/teacher/courses/${courseId}/exams`;

  const load = useCallback(async () => {
    if (!sid || Number.isNaN(sid)) return;
    setLoading(true);
    setError("");
    try {
      setData(await api<ExamSessionResults>(`/api/exams/sessions/${sid}/results`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [sid]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    if (!data) return null;
    const submitted = data.results.filter((r) => r.status === "submitted").length;
    return { total: data.results.length, submitted };
  }, [data]);

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <Alert severity="error">{error || he.errorGeneric}</Alert>;
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <Button
        component={RouterLink}
        to={backTo}
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ mb: 2 }}
      >
        {he.backToExams}
      </Button>

      <Box sx={{ mb: 2, ...hebrewAlignRightSx }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {he.examResults}
        </Typography>
        <Typography variant="h6" gutterBottom>
          {data.exam_title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.offering_label}
        </Typography>
      </Box>
      <Box sx={{ mb: 2, ...hebrewAlignRightSx }}>
        <DisabledActionTooltip
          disabled={!data.can_correct_answer_key}
          disabledReason={
            data.can_correct_answer_key ? undefined : he.correctAnswerKeyBlocked
          }
        >
          <Button
            variant="outlined"
            onClick={() => setKeyOpen(true)}
            disabled={!data.can_correct_answer_key}
          >
            {he.correctAnswerKey}
          </Button>
        </DisabledActionTooltip>
      </Box>
      {data.integrity_mode_enabled && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {he.integrityMode}: {he.integrityModeHint}
        </Alert>
      )}

      {summary && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          {he.resultsSummary}: {summary.submitted} / {summary.total}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {data.results.length === 0 ? (
            <Box p={3}>
              <Typography color="text.secondary">{he.noResultsYet}</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{he.fullName}</TableCell>
                    <TableCell>{he.studentId}</TableCell>
                    <TableCell>{he.status}</TableCell>
                    <TableCell align="left">{he.score}</TableCell>
                    <TableCell align="left">{he.submittedAt}</TableCell>
                    {data.integrity_mode_enabled && (
                      <>
                        <TableCell align="left">{he.integrityTabLeaves}</TableCell>
                        <TableCell align="left">{he.integrityHiddenTime}</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.results.map((row) => (
                    <TableRow key={row.student_id}>
                      <TableCell>{row.student_name}</TableCell>
                      <TableCell>{row.student_number || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusLabel[row.status]}
                          color={statusColor[row.status]}
                        />
                      </TableCell>
                      <TableCell align="left">
                        {row.score != null && row.max_score != null
                          ? `${row.score} / ${row.max_score}`
                          : "—"}
                      </TableCell>
                      <TableCell align="left">{formatDateTime(row.submitted_at)}</TableCell>
                      {data.integrity_mode_enabled && (
                        <>
                          <TableCell align="left">
                            {row.focus_loss_count != null ? row.focus_loss_count : he.integrityNotApplicable}
                          </TableCell>
                          <TableCell align="left">
                            {row.total_hidden_seconds != null
                              ? formatHiddenDuration(row.total_hidden_seconds)
                              : he.integrityNotApplicable}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <ExamAnswerKeyDialog
        open={keyOpen}
        examId={data.exam_id}
        submittedCount={summary?.submitted ?? 0}
        onClose={() => setKeyOpen(false)}
        onSaved={(message) => {
          setSuccess(message);
          void load();
        }}
      />
    </Box>
  );
}
