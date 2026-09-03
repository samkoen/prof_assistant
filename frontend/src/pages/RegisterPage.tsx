import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Link, TextField, Typography } from "@mui/material";
import AuthLayout from "../components/ui/AuthLayout";
import LoadingButton from "../components/ui/LoadingButton";
import PasswordField from "../components/ui/PasswordField";
import { api, ApiError } from "../api/client";
import { he } from "../i18n/he";
import { shouldOfferResendVerification } from "../utils/resendVerification";
import ResendVerificationForm from "../components/ResendVerificationForm";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const joinToken = searchParams.get("joinToken") ?? searchParams.get("join");
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    student_id: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginLink = joinToken
    ? `/login?joinToken=${encodeURIComponent(joinToken)}`
    : "/login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          phone: form.phone || null,
          student_id: form.student_id || null,
          role: "student",
        }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title={he.register}>
        <Alert severity="success" sx={{ mb: 2.5 }}>
          {he.registerSuccessAwaitVerification}
        </Alert>
        <ResendVerificationForm initialEmail={form.email} lockEmail />
        <Button component={RouterLink} to={loginLink} variant="contained" size="large" fullWidth sx={{ mt: 2 }}>
          {he.goToLogin}
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={he.register}>
      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {shouldOfferResendVerification(error) && (
        <ResendVerificationForm initialEmail={form.email} />
      )}
      <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.25}>
        <TextField
          label={he.fullName}
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
          fullWidth
          autoFocus
        />
        <TextField
          label={he.email}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          fullWidth
          dir="ltr"
          autoComplete="email"
        />
        <PasswordField
          label={he.password}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          fullWidth
          autoComplete="new-password"
          helperText={he.passwordMinHint}
          inputProps={{ minLength: 6 }}
        />
        <TextField
          label={he.phone}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          fullWidth
        />
        <TextField
          label={he.studentId}
          value={form.student_id}
          onChange={(e) => setForm({ ...form, student_id: e.target.value })}
          fullWidth
        />
        <LoadingButton type="submit" variant="contained" size="large" loading={loading} sx={{ mt: 0.5 }}>
          {he.register}
        </LoadingButton>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
        {he.alreadyHaveAccount}{" "}
        <Link component={RouterLink} to={loginLink} fontWeight={700}>
          {he.login}
        </Link>
      </Typography>
    </AuthLayout>
  );
}
