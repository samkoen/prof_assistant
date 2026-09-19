import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { api, ApiError, type OfferingTeachersPayload } from "../api/client";
import { he } from "../i18n/he";
import { isOfferingOwner, type OfferingTeacherRef } from "../utils/offeringTeachers";

interface OfferingTeachersDialogProps {
  open: boolean;
  offeringId: number | null;
  userId: number | undefined;
  onClose: () => void;
  onChanged: () => void;
}

function roleLabel(role: OfferingTeacherRef["role"]): string {
  return role === "owner" ? he.offeringOwnerRole : he.offeringCoTeacherRole;
}

function useOfferingTeachers(open: boolean, offeringId: number | null) {
  const [data, setData] = useState<OfferingTeachersPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (offeringId == null) return;
    setLoading(true);
    setError("");
    try {
      setData(await api<OfferingTeachersPayload>(`/api/courses/${offeringId}/teachers`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [offeringId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  return { data, error, setError, loading, load };
}

export default function OfferingTeachersDialog({
  open,
  offeringId,
  userId,
  onClose,
  onChanged,
}: OfferingTeachersDialogProps) {
  const { data, error, setError, loading, load } = useOfferingTeachers(open, offeringId);
  const owner = isOfferingOwner(data?.teachers, userId);

  const afterChange = async () => {
    await load();
    onChanged();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.manageOfferingTeachers}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading || !data ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TeachersLists
            offeringId={offeringId}
            data={data}
            owner={owner}
            userId={userId}
            onError={setError}
            onChanged={afterChange}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
      </DialogActions>
    </Dialog>
  );
}

function TeachersLists({
  offeringId,
  data,
  owner,
  userId,
  onError,
  onChanged,
}: {
  offeringId: number | null;
  data: OfferingTeachersPayload;
  owner: boolean;
  userId: number | undefined;
  onError: (msg: string) => void;
  onChanged: () => Promise<void>;
}) {
  return (
    <>
      <MemberList
        offeringId={offeringId}
        teachers={data.teachers}
        owner={owner}
        userId={userId}
        onError={onError}
        onChanged={onChanged}
      />
      <PendingList
        invites={data.pending_invites}
        owner={owner}
        onError={onError}
        onChanged={onChanged}
      />
    </>
  );
}

function MemberList({
  offeringId,
  teachers,
  owner,
  userId,
  onError,
  onChanged,
}: {
  offeringId: number | null;
  teachers: OfferingTeacherRef[];
  owner: boolean;
  userId: number | undefined;
  onError: (msg: string) => void;
  onChanged: () => Promise<void>;
}) {
  const remove = async (teacherId: number) => {
    if (offeringId == null) return;
    try {
      await api(`/api/courses/${offeringId}/teachers/${teacherId}`, { method: "DELETE" });
      await onChanged();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const leave = async () => {
    if (offeringId == null) return;
    try {
      await api(`/api/courses/${offeringId}/teachers/me/leave`, { method: "POST" });
      await onChanged();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  return (
    <List dense>
      {teachers.map((t) => (
        <ListItem
          key={t.id}
          secondaryAction={
            <MemberAction
              teacher={t}
              owner={owner}
              userId={userId}
              onRemove={() => remove(t.id)}
              onLeave={leave}
            />
          }
        >
          <ListItemText primary={t.name} secondary={roleLabel(t.role)} />
        </ListItem>
      ))}
    </List>
  );
}

function MemberAction({
  teacher,
  owner,
  userId,
  onRemove,
  onLeave,
}: {
  teacher: OfferingTeacherRef;
  owner: boolean;
  userId: number | undefined;
  onRemove: () => void;
  onLeave: () => void;
}) {
  if (owner && teacher.role === "co_teacher") {
    return (
      <Button size="small" color="error" onClick={onRemove}>
        {he.removeCoTeacher}
      </Button>
    );
  }
  if (!owner && teacher.id === userId && teacher.role === "co_teacher") {
    return (
      <Button size="small" color="error" onClick={onLeave}>
        {he.leaveOffering}
      </Button>
    );
  }
  return <Chip size="small" label={roleLabel(teacher.role)} />;
}

function PendingList({
  invites,
  owner,
  onError,
  onChanged,
}: {
  invites: OfferingTeachersPayload["pending_invites"];
  owner: boolean;
  onError: (msg: string) => void;
  onChanged: () => Promise<void>;
}) {
  if (invites.length === 0) {
    return null;
  }

  const cancel = async (id: number) => {
    try {
      await api(`/api/offering-teacher-invites/${id}`, { method: "DELETE" });
      await onChanged();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {invites.map((inv) => (
        <Box key={inv.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Chip size="small" label={he.shareStatusPending} />
          <Box sx={{ flex: 1 }}>{inv.recipient_name}</Box>
          {owner && (
            <Button size="small" onClick={() => cancel(inv.id)}>
              {he.cancelTeacherInvite}
            </Button>
          )}
        </Box>
      ))}
    </Box>
  );
}
