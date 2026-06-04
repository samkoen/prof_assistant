import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ListPageToolbar from "../../components/ListPageToolbar";
import AcceptTeacherShareDialog from "../../components/AcceptTeacherShareDialog";
import { api, ApiError, type TeacherShare } from "../../api/client";
import { he } from "../../i18n/he";

function statusLabel(s: TeacherShare["status"]) {
  if (s === "pending") return he.shareStatusPending;
  if (s === "accepted") return he.shareStatusAccepted;
  return he.shareStatusDeclined;
}

function shareSummary(row: TeacherShare): string {
  if (row.share_type === "catalog") {
    return `${row.source_catalog_name ?? ""} (${row.source_exam_count ?? 0} ${he.exams})`;
  }
  return row.source_exam_title ?? "";
}

export default function TeacherSharesPage() {
  const [incoming, setIncoming] = useState<TeacherShare[]>([]);
  const [sent, setSent] = useState<TeacherShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptShare, setAcceptShare] = useState<TeacherShare | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [inc, out] = await Promise.all([
        api<TeacherShare[]>("/api/teacher-shares/incoming"),
        api<TeacherShare[]>("/api/teacher-shares/sent"),
      ]);
      setIncoming(inc);
      setSent(out);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decline = async (id: number) => {
    try {
      await api(`/api/teacher-shares/${id}/decline`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const pending = incoming.filter((s) => s.status === "pending");

  return (
    <Box sx={{ width: "100%" }} dir="rtl">
      <ListPageToolbar title={he.teacherShares} subtitle={he.teacherSharesSubtitle} />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {he.incomingShares}
          </Typography>
          {pending.length === 0 ? (
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {he.noIncomingShares}
            </Typography>
          ) : (
            <Paper sx={{ mb: 4, overflow: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{he.teacher}</TableCell>
                    <TableCell>{he.subject}</TableCell>
                    <TableCell align="left">{he.actions}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pending.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.sender_name}</TableCell>
                      <TableCell>{shareSummary(row)}</TableCell>
                      <TableCell align="left">
                        <Button size="small" onClick={() => setAcceptShare(row)}>
                          {he.acceptShare}
                        </Button>
                        <Button size="small" color="inherit" onClick={() => decline(row.id)}>
                          {he.declineShare}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          <Typography variant="h6" sx={{ mb: 1 }}>
            {he.sentShares}
          </Typography>
          <Paper sx={{ overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{he.teacher}</TableCell>
                  <TableCell>{he.subject}</TableCell>
                  <TableCell>{he.status}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sent.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.recipient_name}</TableCell>
                    <TableCell>{shareSummary(row)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={statusLabel(row.status)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
      <AcceptTeacherShareDialog
        share={acceptShare}
        open={!!acceptShare}
        onClose={() => setAcceptShare(null)}
        onAccepted={load}
      />
    </Box>
  );
}
