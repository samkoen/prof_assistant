import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Alert, Box, Link, TextField, Typography } from "@mui/material";
import AuthLayout from "../components/ui/AuthLayout";
import LoadingButton from "../components/ui/LoadingButton";
import { api, ApiError } from "../api/client";
import { he } from "../i18n/he";
import { canSubmitForgotEmail, withJoinToken } from "../utils/forgotPassword";

type ForgotState = {
  email: string;
  loading: boolean;
  done: boolean;
  error: string;
};

async function postForgotPassword(email: string): Promise<void> {
  await api("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
}

async function submitForgot(
  event: React.FormEvent,
  state: ForgotState,
  setState: React.Dispatch<React.SetStateAction<ForgotState>>,
) {
  event.preventDefault();
  if (!canSubmitForgotEmail(state.email)) {
    setState((prev) => ({ ...prev, error: he.resendVerificationNeedEmail }));
    return;
  }
  setState((prev) => ({ ...prev, error: "", loading: true }));
  try {
    await postForgotPassword(state.email);
    setState((prev) => ({ ...prev, loading: false, done: true }));
  } catch (err) {
    const message = err instanceof ApiError ? err.message : he.errorGeneric;
    setState((prev) => ({ ...prev, loading: false, error: message }));
  }
}

function ForgotAlerts({
  state,
  setState,
}: {
  state: ForgotState;
  setState: React.Dispatch<React.SetStateAction<ForgotState>>;
}) {
  return (
    <>
      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setState((prev) => ({ ...prev, error: "" }))}>
          {state.error}
        </Alert>
      )}
      {state.done && <Alert severity="success" sx={{ mb: 2 }}>{he.forgotPasswordSent}</Alert>}
    </>
  );
}

function ForgotPasswordBody({
  state,
  loginTo,
  setState,
}: {
  state: ForgotState;
  loginTo: string;
  setState: React.Dispatch<React.SetStateAction<ForgotState>>;
}) {
  return (
    <>
      <ForgotAlerts state={state} setState={setState} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: "start" }}>
        {he.forgotPasswordHint}
      </Typography>
      <Box
        component="form"
        onSubmit={(event) => void submitForgot(event, state, setState)}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <TextField
          label={he.email}
          type="email"
          value={state.email}
          onChange={(event) => setState((prev) => ({ ...prev, email: event.target.value }))}
          required
          fullWidth
          dir="ltr"
          autoComplete="email"
          autoFocus
        />
        <LoadingButton type="submit" variant="contained" size="large" loading={state.loading} disabled={state.done}>
          {he.forgotPasswordCta}
        </LoadingButton>
      </Box>
      <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
        <Link component={RouterLink} to={loginTo} fontWeight={700}>
          {he.goToLogin}
        </Link>
      </Typography>
    </>
  );
}

export default function ForgotPasswordPage() {
  const [params] = useSearchParams();
  const joinToken = params.get("joinToken") ?? params.get("join");
  const [state, setState] = useState<ForgotState>({ email: "", loading: false, done: false, error: "" });
  return (
    <AuthLayout title={he.forgotPasswordTitle}>
      <ForgotPasswordBody state={state} loginTo={withJoinToken("/login", joinToken)} setState={setState} />
    </AuthLayout>
  );
}
