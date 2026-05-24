import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { api, offeringLabel, semesterLabel, type CourseOffering, type ExamSession, ApiError } from "../api/client";
import { he } from "../i18n/he";

export default function StudentDashboard() {
  const [tab, setTab] = useState(0);
  const [myOfferings, setMyOfferings] = useState<CourseOffering[]>([]);
  const [openOfferings, setOpenOfferings] = useState<CourseOffering[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    const mine = await api<CourseOffering[]>("/api/courses/mine");
    setMyOfferings(mine);
    const open = await api<CourseOffering[]>("/api/courses/open");
    setOpenOfferings(open.filter((c) => !mine.some((m) => m.id === c.id)));
    setSessions(await api<ExamSession[]>("/api/exams/sessions/mine"));
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const join = async (offeringId: number) => {
    setMessage("");
    try {
      await api("/api/enrollments/request", {
        method: "POST",
        body: JSON.stringify({ offering_id: offeringId }),
      });
      setMessage("בקשת ההצטרפות נשלחה לאישור המורה");
      await load();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : he.errorGeneric);
    }
  };

  const statusLabel = (s: ExamSession["status"]) =>
    s === "active" ? "פעיל" : s === "draft" ? "טיוטה" : "סגור";

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        {he.dashboard}
      </Typography>
      {message && <Alert sx={{ mb: 2 }}>{message}</Alert>}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={he.myCourses} />
        <Tab label={he.openCourses} />
        <Tab label={he.exams} />
      </Tabs>
      {tab === 0 && (
        <Grid container spacing={2}>
          {myOfferings.map((o) => (
            <Grid item xs={12} md={6} key={o.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{offeringLabel(o)}</Typography>
                  <Typography color="text.secondary">{o.teacher_name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {tab === 1 && (
        <Grid container spacing={2}>
          {openOfferings.map((o) => (
            <Grid item xs={12} md={6} key={o.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{offeringLabel(o)}</Typography>
                  <Button variant="outlined" sx={{ mt: 1 }} onClick={() => join(o.id)}>
                    {he.joinCourse}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {tab === 2 && (
        <Grid container spacing={2}>
          {sessions.length === 0 && <Typography>{he.noExams}</Typography>}
          {sessions.map((s) => (
            <Grid item xs={12} md={6} key={s.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{s.exam_title}</Typography>
                    <Chip label={statusLabel(s.status)} color={s.status === "active" ? "success" : "default"} size="small" />
                  </Box>
                  <Typography color="text.secondary">
                    {s.catalog_name} — {semesterLabel(s.semester)} {s.academic_year}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
