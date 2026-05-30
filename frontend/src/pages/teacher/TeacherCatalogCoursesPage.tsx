import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import ListPageToolbar from "../../components/ListPageToolbar";
import { CatalogCardGrid } from "../../components/CourseCardGrid/CourseCardGrid";
import { api, ApiError, type CatalogCourse } from "../../api/client";
import { he } from "../../i18n/he";

export default function TeacherCatalogCoursesPage() {
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCatalogs(await api<CatalogCourse[]>("/api/catalog-courses/mine"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createCatalog = async () => {
    try {
      await api("/api/catalog-courses", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
        }),
      });
      setOpen(false);
      setForm({ name: "", description: "" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <ListPageToolbar
        title={he.catalogCourses}
        subtitle={he.catalogCoursesSubtitle}
        addLabel={he.createCatalogCourse}
        onAdd={() => setOpen(true)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading && catalogs.length === 0 ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <CatalogCardGrid catalogs={catalogs} />
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{he.createCatalogCourse}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label={he.subject}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="לדוגמה: מבני נתונים"
            fullWidth
          />
          <TextField
            label={he.description}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{he.cancel}</Button>
          <Button variant="contained" onClick={createCatalog}>
            {he.submit}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
