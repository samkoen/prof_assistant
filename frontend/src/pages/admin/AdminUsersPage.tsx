import { useCallback, useEffect, useMemo, useState } from "react";
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
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import BidiTextField from "../../components/BidiTextField";
import ListPageToolbar from "../../components/ListPageToolbar";
import DataListTable from "../../components/DataListTable/DataListTable";
import type { DataListColumnDef } from "../../components/DataListTable/types";
import { api, ApiError, type User } from "../../api/client";
import { he } from "../../i18n/he";

const roleLabels: Record<User["role"], string> = {
  admin: he.roleAdmin,
  teacher: he.roleTeacher,
  student: he.roleStudent,
};

const roleColors: Record<User["role"], "default" | "primary" | "error" | "success"> = {
  admin: "error",
  teacher: "primary",
  student: "success",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "student" as User["role"],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await api<User[]>("/api/admin/users"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createUser = async () => {
    try {
      await api("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      setOpen(false);
      setForm({ email: "", password: "", full_name: "", role: "student" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const toggleBlock = async (user: User, blocked: boolean) => {
    try {
      await api(`/api/admin/users/${user.id}/block?blocked=${blocked}`, { method: "PATCH" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const columns = useMemo<DataListColumnDef<User>[]>(
    () => [
      {
        key: "full_name",
        label: he.fullName,
        minWidth: 140,
        getValue: (u) => u.full_name,
        renderCell: (u) => u.full_name,
      },
      {
        key: "email",
        label: he.email,
        minWidth: 180,
        getValue: (u) => u.email,
        renderCell: (u) => u.email,
      },
      {
        key: "phone",
        label: he.phone,
        minWidth: 110,
        getValue: (u) => u.phone ?? "",
        renderCell: (u) => u.phone || "—",
      },
      {
        key: "role",
        label: he.role,
        minWidth: 100,
        getValue: (u) => roleLabels[u.role],
        renderCell: (u) => (
          <Chip label={roleLabels[u.role]} color={roleColors[u.role]} size="small" />
        ),
      },
      {
        key: "status",
        label: he.status,
        minWidth: 110,
        getValue: (u) =>
          u.is_blocked ? he.blocked : u.email_verified ? he.verified : he.pending,
        renderCell: (u) =>
          u.is_blocked ? (
            <Chip label={he.blocked} color="error" size="small" />
          ) : (
            <Chip
              label={u.email_verified ? he.verified : he.pending}
              color={u.email_verified ? "success" : "warning"}
              size="small"
            />
          ),
      },
    ],
    []
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <ListPageToolbar
        title={he.adminUsers}
        subtitle={he.adminUsersSubtitle}
        addLabel={he.newUser}
        onAdd={() => setOpen(true)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading && users.length === 0 ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <DataListTable
          viewKey="admin-users"
          rows={users}
          columns={columns}
          loading={loading}
          emptyMessage={he.noUsers}
          getRowId={(u) => u.id}
          renderActions={(u) => (
            <Tooltip title={u.is_blocked ? he.unblockUser : he.blockUser}>
              <IconButton
                size="small"
                color={u.is_blocked ? "success" : "warning"}
                onClick={() => toggleBlock(u, !u.is_blocked)}
              >
                {u.is_blocked ? (
                  <LockOpenIcon fontSize="small" />
                ) : (
                  <BlockIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
        />
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>{he.newUser}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <BidiTextField
            label={he.fullName}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
            fullWidth
            showDirectionHint
          />
          <TextField
            label={he.email}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            fullWidth
            dir="ltr"
            data-bidi="off"
            slotProps={{ htmlInput: { dir: "ltr" } }}
          />
          <TextField
            label={he.password}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            fullWidth
            dir="ltr"
            data-bidi="off"
            slotProps={{ htmlInput: { dir: "ltr" } }}
          />
          <TextField
            select
            label={he.role}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}
            fullWidth
          >
            <MenuItem value="teacher">{he.roleTeacher}</MenuItem>
            <MenuItem value="student">{he.roleStudent}</MenuItem>
            <MenuItem value="admin">{he.roleAdmin}</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>{he.cancel}</Button>
          <Button variant="contained" onClick={createUser}>
            {he.submit}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
