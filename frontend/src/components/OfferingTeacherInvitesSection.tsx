import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { api, ApiError, type OfferingTeacherInvite } from "../api/client";
import { he } from "../i18n/he";

function inviteLabel(row: OfferingTeacherInvite): string {
  return `${row.catalog_name} — ${row.group_name}`;
}

function statusChip(status: OfferingTeacherInvite["status"]) {
  if (status === "pending") return he.shareStatusPending;
  if (status === "accepted") return he.shareStatusAccepted;
  return he.shareStatusDeclined;
}

export default function OfferingTeacherInvitesSection({
  onError,
}: {
  onError: (msg: string) => void;
}) {
  const [incoming, setIncoming] = useState<OfferingTeacherInvite[]>([]);
  const [sent, setSent] = useState<OfferingTeacherInvite[]>([]);

  const load = useCallback(async () => {
    const [inc, out] = await Promise.all([
      api<OfferingTeacherInvite[]>("/api/offering-teacher-invites/incoming"),
      api<OfferingTeacherInvite[]>("/api/offering-teacher-invites/sent"),
    ]);
    setIncoming(inc);
    setSent(out);
  }, []);

  useEffect(() => {
    load().catch((e) => onError(e instanceof ApiError ? e.message : he.errorGeneric));
  }, [load, onError]);

  const pending = incoming.filter((s) => s.status === "pending");

  const accept = async (id: number) => {
    try {
      await api(`/api/offering-teacher-invites/${id}/accept`, { method: "POST" });
      await load();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const decline = async (id: number) => {
    try {
      await api(`/api/offering-teacher-invites/${id}/decline`, { method: "POST" });
      await load();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  return (
    <Box sx={{ mt: 4 }} dir="rtl">
      <Typography variant="h6" sx={{ mb: 2 }}>
        {he.offeringTeacherInvites}
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {he.incomingOfferingInvites}
      </Typography>
      <IncomingTable pending={pending} onAccept={accept} onDecline={decline} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        {he.sentOfferingInvites}
      </Typography>
      <SentTable sent={sent} />
    </Box>
  );
}

function IncomingTable({
  pending,
  onAccept,
  onDecline,
}: {
  pending: OfferingTeacherInvite[];
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
}) {
  if (pending.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {he.noOfferingTeacherInvites}
      </Typography>
    );
  }
  return (
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
              <TableCell>{row.inviter_name}</TableCell>
              <TableCell>{inviteLabel(row)}</TableCell>
              <TableCell align="left">
                <Button size="small" onClick={() => onAccept(row.id)}>
                  {he.acceptTeacherInvite}
                </Button>
                <Button size="small" color="inherit" onClick={() => onDecline(row.id)}>
                  {he.declineTeacherInvite}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

function SentTable({ sent }: { sent: OfferingTeacherInvite[] }) {
  return (
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
              <TableCell>{inviteLabel(row)}</TableCell>
              <TableCell>
                <Chip size="small" label={statusChip(row.status)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
