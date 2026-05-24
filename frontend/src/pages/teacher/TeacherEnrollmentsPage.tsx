import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import ListPageToolbar from "../../components/ListPageToolbar";
import { api, ApiError, type Enrollment } from "../../api/client";
import { he } from "../../i18n/he";

export default function TeacherEnrollmentsPage() {
  const [pending, setPending] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPending(await api<Enrollment[]>("/api/enrollments/pending"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (enrollmentId: number, status: "approved" | "rejected") => {
    try {
      await api(`/api/enrollments/${enrollmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <ListPageToolbar title={he.pendingApprovals} subtitle={he.enrollmentsSubtitle} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : pending.length === 0 ? (
        <Typography color="text.secondary">{he.pending} — 0</Typography>
      ) : (
        pending.map((p) => (
          <Card key={p.id} sx={{ mb: 1 }}>
            <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Box flex={1} minWidth={200}>
                <Typography fontWeight={600}>{p.student_name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {p.student_email}
                </Typography>
              </Box>
              <Button size="small" variant="contained" onClick={() => review(p.id, "approved")}>
                {he.approve}
              </Button>
              <Button size="small" color="error" onClick={() => review(p.id, "rejected")}>
                {he.reject}
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
