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
  Tooltip,
  TextField,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import ListPageToolbar from "../../components/ListPageToolbar";
import { CatalogCardGrid } from "../../components/CourseCardGrid/CourseCardGrid";
import ShareWithTeacherDialog from "../../components/ShareWithTeacherDialog";
import { api, ApiError, type CatalogCourse } from "../../api/client";
import { he } from "../../i18n/he";

export default function TeacherCatalogCoursesPage() {
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [shareCatalog, setShareCatalog] = useState<CatalogCourse | null>(null);
  const [shareNotice, setShareNotice] = useState("");

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
        subtitle={`${he.catalogCoursesSubtitle} — ${he.catalogCoursePerTeacherHint}`}
        addLabel={he.createCatalogCourse}
        onAdd={() => setOpen(true)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {shareNotice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setShareNotice("")}>
          {shareNotice}
        </Alert>
      )}

      {catalogs.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {catalogs.map((c) => (
            <Tooltip key={c.id} title={he.shareCatalog}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={() => setShareCatalog(c)}
              >
                {c.name}
              </Button>
            </Tooltip>
          ))}
        </Box>
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

      <ShareWithTeacherDialog
        open={!!shareCatalog}
        kind="catalog"
        catalogId={shareCatalog?.id}
        itemLabel={shareCatalog?.name ?? ""}
        onClose={() => setShareCatalog(null)}
        onSent={() => setShareNotice(he.shareSent)}
      />
    </Box>
  );
}
