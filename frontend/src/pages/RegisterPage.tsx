import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Link, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import AuthLayout from "../components/ui/AuthLayout";
import LoadingButton from "../components/ui/LoadingButton";
import PasswordField from "../components/ui/PasswordField";
import { api, ApiError } from "../api/client";
import { he } from "../i18n/he";
import { shouldOfferResendVerification } from "../utils/resendVerification";
import ResendVerificationForm from "../components/ResendVerificationForm";
import {
  applyRegisterRole,
  buildRegisterPayload,
  canChooseRegisterRole,
  showStudentIdField,
  type RegisterFormValues,
  type SelfRegisterRole,
} from "../utils/registerForm";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";

function emptyForm(): RegisterFormValues {
  return {
    email: "",
    password: "",
    full_name: "",
    phone: "",
    student_id: "",
    role: "student",
  };
}

function RegisterRoleToggle({
  role,
  onChange,
}: {
  role: SelfRegisterRole;
  onChange: (role: SelfRegisterRole) => void;
}) {
  return (
    <Box sx={hebrewAlignRightSx}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {he.registerRoleHint}
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        color="primary"
        value={role}
        onChange={(_, value: SelfRegisterRole | null) => {
          if (value) onChange(value);
        }}
        aria-label={he.role}
      >
        <ToggleButton value="student">{he.roleStudent}</ToggleButton>
        <ToggleButton value="teacher">{he.roleTeacher}</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const joinToken = searchParams.get("joinToken") ?? searchParams.get("join");
  const [form, setForm] = useState<RegisterFormValues>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginLink = joinToken
    ? `/login?joinToken=${encodeURIComponent(joinToken)}`
    : "/login";
  const chooseRole = canChooseRegisterRole(joinToken);
  const title = form.role === "teacher" ? he.registerAsTeacher : he.register;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(buildRegisterPayload(form)),
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
      <AuthLayout title={title}>
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
    <AuthLayout title={title}>
      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {shouldOfferResendVerification(error) && (
        <ResendVerificationForm initialEmail={form.email} />
      )}
      <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.25}>
        {chooseRole && (
          <RegisterRoleToggle
            role={form.role}
            onChange={(role) => setForm(applyRegisterRole(form, role))}
          />
        )}
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
        {showStudentIdField(form.role) && (
          <TextField
            label={he.studentId}
            value={form.student_id}
            onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            fullWidth
          />
        )}
        <LoadingButton type="submit" variant="contained" size="large" loading={loading} sx={{ mt: 0.5 }}>
          {title}
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
