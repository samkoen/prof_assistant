import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import type { User } from "../api/client";
import { resetPasswordFormError } from "../utils/resetPasswordForm";
import { he } from "../i18n/he";

type Props = {
  user: User | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
};

const ltrPasswordSlot = {
  htmlInput: { dir: "ltr" as const, autoComplete: "new-password" },
};

function passwordErrorLabel(kind: ReturnType<typeof resetPasswordFormError>): string {
  if (kind === "too_short") return he.passwordMinHint;
  if (kind === "mismatch") return he.passwordMismatch;
  return "";
}

function PasswordFields({
  password,
  confirm,
  formError,
  onPassword,
  onConfirm,
}: {
  password: string;
  confirm: string;
  formError: ReturnType<typeof resetPasswordFormError>;
  onPassword: (value: string) => void;
  onConfirm: (value: string) => void;
}) {
  return (
    <>
      <TextField
        label={he.newPassword}
        type="password"
        value={password}
        onChange={(e) => onPassword(e.target.value)}
        required
        fullWidth
        dir="ltr"
        data-bidi="off"
        helperText={he.passwordMinHint}
        slotProps={ltrPasswordSlot}
      />
      <TextField
        label={he.confirmPassword}
        type="password"
        value={confirm}
        onChange={(e) => onConfirm(e.target.value)}
        required
        fullWidth
        dir="ltr"
        data-bidi="off"
        error={confirm.length > 0 && formError === "mismatch"}
        helperText={confirm.length > 0 ? passwordErrorLabel(formError) : " "}
        slotProps={ltrPasswordSlot}
      />
    </>
  );
}

export default function AdminResetPasswordDialog({ user, saving, onClose, onSubmit }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const formError = resetPasswordFormError(password, confirm);
  const canSubmit = Boolean(user) && !saving && formError === null;

  useEffect(() => {
    setPassword("");
    setConfirm("");
  }, [user?.id]);

  return (
    <Dialog open={!!user} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{he.resetPassword}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        {user && (
          <Typography variant="body2" color="text.secondary">
            {he.resetPasswordFor(user.full_name || user.email, user.email)}
          </Typography>
        )}
        <PasswordFields
          password={password}
          confirm={confirm}
          formError={formError}
          onPassword={setPassword}
          onConfirm={setConfirm}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          {he.cancel}
        </Button>
        <Button variant="contained" disabled={!canSubmit} onClick={() => onSubmit(password)}>
          {saving ? he.loading : he.resetPassword}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
