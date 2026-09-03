import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Link, TextField, Typography } from "@mui/material";
import AuthLayout from "../components/ui/AuthLayout";
import LoadingButton from "../components/ui/LoadingButton";
import PasswordField from "../components/ui/PasswordField";
import { useAuth } from "../context/AuthContext";
import { he } from "../i18n/he";
import { ApiError } from "../api/client";
import { joinRedirectPath } from "../utils/joinCourse";
import { shouldOfferResendVerification } from "../utils/resendVerification";
import ResendVerificationForm from "../components/ResendVerificationForm";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinToken = searchParams.get("joinToken") ?? searchParams.get("join");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

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
      const message = err instanceof ApiError ? err.message : he.errorGeneric;
      setError(message);
      if (shouldOfferResendVerification(message)) setShowResend(true);
    } finally {
      setLoading(false);
    }
  };

  const registerTo = joinToken
    ? `/register?joinToken=${encodeURIComponent(joinToken)}`
    : "/register";

  return (
    <AuthLayout title={he.login}>
      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.25}>
        <TextField
          label={he.email}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          dir="ltr"
          autoComplete="email"
          autoFocus
        />
        <PasswordField
          label={he.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          autoComplete="current-password"
        />
        <LoadingButton type="submit" variant="contained" size="large" loading={loading} sx={{ mt: 0.5 }}>
          {he.login}
        </LoadingButton>
      </Box>
      {(showResend || shouldOfferResendVerification(error)) && (
        <ResendVerificationForm initialEmail={email} />
      )}
      {!showResend && !shouldOfferResendVerification(error) && (
        <Button variant="text" fullWidth sx={{ mt: 1.5 }} onClick={() => setShowResend(true)}>
          {he.resendVerification}
        </Button>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
        {he.noAccountPrompt}{" "}
        <Link component={RouterLink} to={registerTo} fontWeight={700}>
          {he.register}
        </Link>
      </Typography>
    </AuthLayout>
  );
}
