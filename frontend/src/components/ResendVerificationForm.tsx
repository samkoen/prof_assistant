import { useEffect, useState } from "react";
import { Alert, Box, TextField, Typography } from "@mui/material";
import LoadingButton from "./ui/LoadingButton";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { api, ApiError } from "../api/client";
import { canSubmitResendEmail } from "../utils/resendVerification";
import { he } from "../i18n/he";

type Props = {
  initialEmail?: string;
  lockEmail?: boolean;
};

type FormState = {
  email: string;
  loading: boolean;
  done: boolean;
  error: string;
};

function ResendAlerts({ error, done, onClearError }: {
  error: string;
  done: boolean;
  onClearError: () => void;
}) {
  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={onClearError}>
          {error}
        </Alert>
      )}
      {done && (
        <Alert severity="success" sx={{ mb: 1.5 }}>
          {he.resendVerificationSent}
        </Alert>
      )}
    </>
  );
}

async function postResend(email: string): Promise<void> {
  await api("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
}

async function handleResendSubmit(
  e: React.FormEvent,
  email: string,
  setState: React.Dispatch<React.SetStateAction<FormState>>,
) {
  e.preventDefault();
  if (!canSubmitResendEmail(email)) {
    setState((prev) => ({ ...prev, error: he.resendVerificationNeedEmail }));
    return;
  }
  setState((prev) => ({ ...prev, error: "", loading: true }));
  try {
    await postResend(email);
    setState((prev) => ({ ...prev, loading: false, done: true }));
  } catch (err) {
    const message = err instanceof ApiError ? err.message : he.errorGeneric;
    setState((prev) => ({ ...prev, loading: false, error: message }));
  }
}

function ResendFormBody({
  state,
  lockEmail,
  setState,
}: {
  state: FormState;
  lockEmail: boolean;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, ...hebrewAlignRightSx }}>
        {he.resendVerificationHint}
      </Typography>
      <ResendAlerts
        error={state.error}
        done={state.done}
        onClearError={() => setState((prev) => ({ ...prev, error: "" }))}
      />
      {!lockEmail && (
        <TextField
          label={he.email}
          type="email"
          value={state.email}
          onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))}
          fullWidth
          dir="ltr"
          autoComplete="email"
          sx={{ mb: 1.5 }}
        />
      )}
      <LoadingButton type="submit" variant="outlined" fullWidth loading={state.loading} disabled={state.done}>
        {he.resendVerificationCta}
      </LoadingButton>
    </>
  );
}

export default function ResendVerificationForm({ initialEmail = "", lockEmail = false }: Props) {
  const [state, setState] = useState<FormState>({
    email: initialEmail,
    loading: false,
    done: false,
    error: "",
  });
  useEffect(() => {
    setState((prev) => ({ ...prev, email: initialEmail }));
  }, [initialEmail]);
  return (
    <Box
      component="form"
      onSubmit={(e) => void handleResendSubmit(e, state.email, setState)}
      dir="rtl"
      sx={{ mt: 2, ...hebrewAlignRightSx }}
    >
      <ResendFormBody state={state} lockEmail={lockEmail} setState={setState} />
    </Box>
  );
}
