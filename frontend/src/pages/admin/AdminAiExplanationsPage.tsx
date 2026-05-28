import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import ListPageToolbar from "../../components/ListPageToolbar";
import {
  ApiError,
  cleanupAiExplanations,
  fetchAiExplanationCacheStats,
  type AiExplanationCacheStats,
} from "../../api/client";
import { he } from "../../i18n/he";

export default function AdminAiExplanationsPage() {
  const [stats, setStats] = useState<AiExplanationCacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [days, setDays] = useState("30");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await fetchAiExplanationCacheStats());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cleanupOld = async () => {
    const parsed = Number(days);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setError(he.aiCleanupInvalidDays);
      return;
    }
    setCleaning(true);
    setError("");
    setSuccess("");
    try {
      const res = await cleanupAiExplanations(parsed);
      setSuccess(`${he.aiCleanupDone}: ${res.deleted_rows}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setCleaning(false);
    }
  };

  const cleanupAll = async () => {
    setCleaning(true);
    setError("");
    setSuccess("");
    try {
      const res = await cleanupAiExplanations();
      setSuccess(`${he.aiCleanupDone}: ${res.deleted_rows}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <ListPageToolbar title={he.aiExplanationsAdminTitle} subtitle={he.aiExplanationsAdminSubtitle} />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            {he.aiExplanationsRows}: {loading ? "—" : stats?.total_rows ?? 0}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {he.aiExplanationsStudents}: {loading ? "—" : stats?.distinct_students ?? 0}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {he.aiExplanationsAttempts}: {loading ? "—" : stats?.distinct_attempts ?? 0}
          </Typography>
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            type="number"
            size="small"
            label={he.aiCleanupOlderThanDays}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            sx={{ width: 180 }}
            inputProps={{ min: 1 }}
          />
          <Button variant="outlined" onClick={cleanupOld} disabled={cleaning}>
            {he.aiCleanupOld}
          </Button>
          <Button variant="contained" color="error" onClick={cleanupAll} disabled={cleaning}>
            {he.aiCleanupAll}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
