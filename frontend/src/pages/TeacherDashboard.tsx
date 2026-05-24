import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  api,
  offeringLabel,
  type CatalogCourse,
  type CourseOffering,
  type Enrollment,
  type ExamSession,
  ApiError,
} from "../api/client";
import { he } from "../i18n/he";

const CURRENT_YEAR = new Date().getFullYear();

export default function TeacherDashboard() {
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogCourse[]>([]);
  const [pending, setPending] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    catalog_course_id: "",
    group_name: "",
    academic_year: String(CURRENT_YEAR),
    semester: "1",
  });
  const [message, setMessage] = useState("");

  const load = async () => {
    setOfferings(await api<CourseOffering[]>("/api/courses/mine"));
    setCatalogs(await api<CatalogCourse[]>("/api/catalog-courses/mine"));
    setPending(await api<Enrollment[]>("/api/enrollments/pending"));
    setSessions(await api<ExamSession[]>("/api/exams/sessions/mine"));
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const createOffering = async () => {
    try {
      await api("/api/courses", {
        method: "POST",
        body: JSON.stringify({
          catalog_course_id: Number(form.catalog_course_id),
          group_name: form.group_name,
          academic_year: Number(form.academic_year),
          semester: Number(form.semester),
        }),
      });
      setDialogOpen(false);
      await load();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const review = async (id: number, status: "approved" | "rejected") => {
    await api(`/api/enrollments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={600}>
          {he.dashboard}
        </Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          {he.createOffering}
        </Button>
      </Box>
      {message && <Alert sx={{ mb: 2 }}>{message}</Alert>}

      <Typography variant="h6" gutterBottom>
        {he.pendingApprovals}
      </Typography>
      {pending.map((p) => (
        <Card key={p.id} sx={{ mb: 1 }}>
          <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Box flex={1}>
              <Typography>{p.student_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {p.student_email}
              </Typography>
            </Box>
            <Button size="small" onClick={() => review(p.id, "approved")}>
              {he.approve}
            </Button>
            <Button size="small" color="error" onClick={() => review(p.id, "rejected")}>
              {he.reject}
            </Button>
          </CardContent>
        </Card>
      ))}

      <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
        {he.myCourses}
      </Typography>
      <Grid container spacing={2}>
        {offerings.map((o) => (
          <Grid item xs={12} md={6} key={o.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{offeringLabel(o)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
        {he.exams}
      </Typography>
      {sessions.map((s) => (
        <Card key={s.id} sx={{ mb: 1 }}>
          <CardContent>
            <Typography>
              {s.exam_title} ({s.status}) — {s.question_count} שאלות
            </Typography>
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{he.createOffering}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            select
            label={he.selectCatalogCourse}
            value={form.catalog_course_id}
            onChange={(e) => setForm({ ...form, catalog_course_id: e.target.value })}
          >
            {catalogs.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={he.groupName}
            value={form.group_name}
            onChange={(e) => setForm({ ...form, group_name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{he.cancel}</Button>
          <Button variant="contained" onClick={createOffering}>
            {he.submit}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
