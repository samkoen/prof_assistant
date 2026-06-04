import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { api, ApiError, type CatalogCourse, type TeacherShare } from "../api/client";
import { he } from "../i18n/he";

const NEW_CATALOG = "__new__";

interface AcceptTeacherShareDialogProps {
  share: TeacherShare | null;
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
}

export default function AcceptTeacherShareDialog({
  share,
  open,
  onClose,
  onAccepted,
}: AcceptTeacherShareDialogProps) {
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [targetId, setTargetId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !share) return;
    (async () => {
      const cats = await api<CatalogCourse[]>("/api/catalog-courses/mine");
      setCatalogs(cats);
      const suggested = share.suggested_catalog_id;
      if (suggested) {
        setTargetId(String(suggested));
      } else {
        setTargetId(NEW_CATALOG);
        setNewName(share.source_catalog_name || share.source_exam_title || "");
      }
      setNewDesc("");
    })().catch(() => undefined);
  }, [open, share]);

  const isNew = targetId === NEW_CATALOG;

  const accept = async () => {
    if (!share) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/teacher-shares/${share.id}/accept`, {
        method: "POST",
        body: JSON.stringify(
          isNew
            ? {
                new_catalog_name: newName.trim(),
                new_catalog_description: newDesc.trim() || null,
              }
            : { target_catalog_id: Number(targetId) }
        ),
      });
      onAccepted();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  if (!share) return null;

  const summary =
    share.share_type === "catalog"
      ? `${he.shareCatalog}: ${share.source_catalog_name} (${share.source_exam_count ?? 0} ${he.exams})`
      : `${he.shareExam}: ${share.source_exam_title}`;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.acceptShare}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {he.shareFromTeacher(share.sender_name)}
        </Typography>
        <Alert severity="info">{summary}</Alert>
        <Typography variant="body2">{he.shareTargetCatalogHint}</Typography>
        <TextField
          select
          label={he.shareTargetCatalog}
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          fullWidth
        >
          <MenuItem value={NEW_CATALOG}>{he.shareCreateNewCatalog}</MenuItem>
          {catalogs.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        {isNew && (
          <>
            <TextField
              label={he.subject}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={he.description}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </>
        )}
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button
          variant="contained"
          onClick={accept}
          disabled={busy || (isNew && !newName.trim()) || (!isNew && !targetId)}
        >
          {busy ? he.loading : he.acceptShare}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
