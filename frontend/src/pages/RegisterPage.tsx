import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Link, TextField, Typography } from "@mui/material";
import AuthLayout from "../components/ui/AuthLayout";
import { api, ApiError } from "../api/client";
import { he } from "../i18n/he";

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

  const loginLink = joinToken
    ? `/login?joinToken=${encodeURIComponent(joinToken)}`
    : "/login";

  if (success) {
    return (
      <AuthLayout title={he.register}>
        <Alert severity="success">
          {he.registerSuccessAwaitVerification}
          <Link component={RouterLink} to={loginLink} sx={{ mr: 1, fontWeight: 600 }}>
            {he.login}
          </Link>
        </Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={he.register}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
        <TextField
          label={he.fullName}
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
          fullWidth
        />
        <TextField
          label={he.email}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          fullWidth
          dir="ltr"
        />
        <TextField
          label={he.password}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          fullWidth
          dir="ltr"
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
        <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 1 }}>
          {loading ? he.loading : he.register}
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5, textAlign: "center" }}>
        <Link component={RouterLink} to={loginLink} fontWeight={600}>
          {he.login}
        </Link>
      </Typography>
    </AuthLayout>
  );
}
