import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Skeleton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import ListPageToolbar from "../../components/ListPageToolbar";
import StudentExamList from "../../components/student/StudentExamList";
import StudentExamTabs, { type StudentExamsTab } from "../../components/student/StudentExamTabs";
import StudentLanguageSetting from "../../components/student/StudentLanguageSetting";
import EmptyState from "../../components/ui/EmptyState";
import { offeringLabel } from "../../api/client";
import { useFocusSession } from "../../hooks/useFocusSession";
import { useStudentOfferingExams } from "../../hooks/useStudentOfferingExams";
import { he } from "../../i18n/he";

/** Examens d'un cours : à faire / terminés, avec retour mis en évidence depuis un examen. */
export default function StudentCourseExamsPage() {
  const id = Number(useParams<{ offeringId: string }>().offeringId);
  const navigate = useNavigate();
  const data = useStudentOfferingExams(id);
  const [tab, setTab] = useState<StudentExamsTab>("pending");
  const highlighted = useFocusSession(
    data.sessions.map((s) => s.id),
    data.loading,
    (sid) => setTab(data.done.some((s) => s.id === sid) ? "done" : "pending"),
  );
  const pendingEnrollment = data.offering?.enrollment_status === "pending";
  const rows = tab === "pending" ? data.pending : data.done;
  const empty =
    tab === "pending" ? (
      <EmptyState title={he.studentExamsPendingEmpty} description={he.noActiveExamsHint} icon={<EventAvailableIcon />} />
    ) : (
      <EmptyState title={he.studentExamsDoneEmpty} icon={<HistoryEduIcon />} />
    );

  return (
    <Box sx={{ width: "100%" }} dir="rtl">
      <Button component={RouterLink} to="/student/courses" startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1 }}>
        {he.backToCourses}
      </Button>
      <ListPageToolbar title={he.courseExams} subtitle={data.offering ? offeringLabel(data.offering) : undefined} titleVariant="h5" />
      <StudentLanguageSetting />
      {data.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => data.setError("")}>{data.error}</Alert>}
      {pendingEnrollment && <Alert severity="warning" sx={{ mb: 2 }}>{he.enrollmentPendingHint}</Alert>}
      {data.loading ? (
        <Skeleton variant="rounded" height={220} />
      ) : (
        <>
          <StudentExamTabs value={tab} pendingCount={data.pending.length} doneCount={data.done.length} onChange={setTab} />
          <StudentExamList sessions={rows} highlightedId={highlighted} empty={empty} onOpen={(sid) => navigate(`/student/exams/${sid}`)} />
        </>
      )}
    </Box>
  );
}
