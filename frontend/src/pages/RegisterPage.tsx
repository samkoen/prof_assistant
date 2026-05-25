import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { api, ApiError } from "../api/client";
import { he } from "../i18n/he";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const joinOfferingId = searchParams.get("join");
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

  if (success) {
    return (
      <Box maxWidth={420} mx="auto" mt={6}>
        <Alert severity="success">
          נרשמת בהצלחה! בדוק את האימייל לאימות החשבון.
          <Link
            component={RouterLink}
            to={joinOfferingId ? `/login?join=${joinOfferingId}` : "/login"}
            sx={{ mr: 1 }}
          >
            {he.login}
          </Link>
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth={420} mx="auto" mt={6}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            {he.register}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField label={he.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required fullWidth />
            <TextField label={he.email} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required fullWidth />
            <TextField label={he.password} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required fullWidth inputProps={{ minLength: 6 }} />
            <TextField label={he.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
            <TextField label={he.studentId} value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} fullWidth />
            <Button type="submit" variant="contained" disabled={loading}>
              {he.register}
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <Link
              component={RouterLink}
              to={joinOfferingId ? `/login?join=${joinOfferingId}` : "/login"}
            >
              {he.login}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
