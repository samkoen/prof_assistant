import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
import { useAuth } from "../context/AuthContext";
import { he } from "../i18n/he";
import { ApiError } from "../api/client";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={420} mx="auto" mt={6}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            {he.login}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField label={he.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label={he.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {he.login}
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            אין לך חשבון?{" "}
            <Link component={RouterLink} to="/register">
              {he.register}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
