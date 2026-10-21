import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Typography } from "@mui/material";
import AuthLayout from "../components/ui/AuthLayout";
import LoadingButton from "../components/ui/LoadingButton";
import PasswordField from "../components/ui/PasswordField";
import { api, ApiError } from "../api/client";
import { he } from "../i18n/he";
import { resetPasswordError, withJoinToken } from "../utils/forgotPassword";

type ResetState = {
  password: string;
  confirm: string;
  loading: boolean;
  done: boolean;
  error: string;
};

async function postResetPassword(token: string, password: string): Promise<void> {
  await api("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password: password }),
  });
}

async function submitReset(
  event: React.FormEvent,
  token: string,
  state: ResetState,
  setState: React.Dispatch<React.SetStateAction<ResetState>>,
) {
  event.preventDefault();
  const problem = resetPasswordError(state.password, state.confirm);
  if (problem) {
    setState((prev) => ({ ...prev, error: problem }));
    return;
  }
  setState((prev) => ({ ...prev, error: "", loading: true }));
  try {
    await postResetPassword(token, state.password);
    setState((prev) => ({ ...prev, loading: false, done: true }));
  } catch (err) {
    const message = err instanceof ApiError ? err.message : he.errorGeneric;
    setState((prev) => ({ ...prev, loading: false, error: message }));
  }
}

function ResetDone({ loginTo }: { loginTo: string }) {
  return (
    <>
      <Alert severity="success" sx={{ mb: 2 }}>{he.resetPasswordSuccess}</Alert>
      <Button component={RouterLink} to={loginTo} variant="contained" fullWidth>
        {he.login}
      </Button>
    </>
  );
}

function ResetPasswordForm({
  token,
  state,
  setState,
}: {
  token: string;
  state: ResetState;
  setState: React.Dispatch<React.SetStateAction<ResetState>>;
}) {
  return (
    <Box
      component="form"
      onSubmit={(event) => void submitReset(event, token, state, setState)}
      display="flex"
      flexDirection="column"
      gap={2}
    >
      {state.error && (
        <Alert severity="error" onClose={() => setState((prev) => ({ ...prev, error: "" }))}>
          {state.error}
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "start" }}>
        {he.resetPasswordHint}
      </Typography>
      <PasswordField
        label={he.newPassword}
        value={state.password}
        onChange={(event) => setState((prev) => ({ ...prev, password: event.target.value }))}
        required
        fullWidth
        autoComplete="new-password"
        helperText={he.passwordMinHint}
      />
      <PasswordField
        label={he.confirmPassword}
        value={state.confirm}
        onChange={(event) => setState((prev) => ({ ...prev, confirm: event.target.value }))}
        required
        fullWidth
        autoComplete="new-password"
      />
      <LoadingButton type="submit" variant="contained" size="large" loading={state.loading}>
        {he.resetPasswordCta}
      </LoadingButton>
    </Box>
  );
}

function ResetPasswordFields({
  token,
  state,
  loginTo,
  setState,
}: {
  token: string;
  state: ResetState;
  loginTo: string;
  setState: React.Dispatch<React.SetStateAction<ResetState>>;
}) {
  if (state.done) return <ResetDone loginTo={loginTo} />;
  return <ResetPasswordForm token={token} state={state} setState={setState} />;
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const joinToken = params.get("joinToken") ?? params.get("join");
  const loginTo = withJoinToken("/login", joinToken);
  const [state, setState] = useState<ResetState>({
    password: "",
    confirm: "",
    loading: false,
    done: false,
    error: token ? "" : he.resetPasswordMissingToken,
  });
  return (
    <AuthLayout title={he.resetPasswordTitle}>
      {token ? (
        <ResetPasswordFields token={token} state={state} loginTo={loginTo} setState={setState} />
      ) : (
        <MissingResetToken joinToken={joinToken} />
      )}
    </AuthLayout>
  );
}

function MissingResetToken({ joinToken }: { joinToken: string | null }) {
  return (
    <>
      <Alert severity="error" sx={{ mb: 2 }}>{he.resetPasswordMissingToken}</Alert>
      <Button component={RouterLink} to={withJoinToken("/forgot-password", joinToken)} variant="contained" fullWidth>
        {he.forgotPassword}
      </Button>
    </>
  );
}
