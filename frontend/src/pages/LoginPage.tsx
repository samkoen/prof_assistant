import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Link, TextField, Typography } from "@mui/material";
import AuthLayout from "../components/ui/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { he } from "../i18n/he";
import { ApiError } from "../api/client";
import { joinRedirectPath } from "../utils/joinCourse";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinToken = searchParams.get("joinToken") ?? searchParams.get("join");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(joinToken ? joinRedirectPath(joinToken) : "/", { replace: true });
    }
  }, [user, navigate, joinToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(joinToken ? joinRedirectPath(joinToken) : "/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={he.login}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
        <TextField
          label={he.email}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          dir="ltr"
        />
        <TextField
          label={he.password}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          dir="ltr"
        />
        <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 1 }}>
          {loading ? he.loading : he.login}
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5, textAlign: "center" }}>
        אין לך חשבון?{" "}
        <Link
          component={RouterLink}
          to={joinToken ? `/register?joinToken=${encodeURIComponent(joinToken)}` : "/register"}
          fontWeight={600}
        >
          {he.register}
        </Link>
      </Typography>
    </AuthLayout>
  );
}
