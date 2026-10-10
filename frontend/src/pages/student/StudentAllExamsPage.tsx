import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Skeleton } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import ListPageToolbar from "../../components/ListPageToolbar";
import StudentExamList from "../../components/student/StudentExamList";
import StudentExamTabs, { type StudentExamsTab } from "../../components/student/StudentExamTabs";
import StudentLanguageSetting from "../../components/student/StudentLanguageSetting";
import EmptyState from "../../components/ui/EmptyState";
import { useFocusSession } from "../../hooks/useFocusSession";
import { useStudentSessions } from "../../hooks/useStudentSessions";
import { he } from "../../i18n/he";

/** Tous les examens de l'élève : à faire d'abord, puis l'historique avec les scores. */
export default function StudentAllExamsPage() {
  const navigate = useNavigate();
  const data = useStudentSessions();
  const [tab, setTab] = useState<StudentExamsTab>("pending");
  const highlighted = useFocusSession(
    data.sessions.map((s) => s.id),
    data.loading,
    (id) => setTab(data.done.some((s) => s.id === id) ? "done" : "pending"),
  );
  const rows = tab === "pending" ? data.pending : data.done;
  const empty =
    tab === "pending" ? (
      <EmptyState title={he.studentExamsPendingEmpty} description={he.noActiveExamsHint} icon={<EventAvailableIcon />} />
    ) : (
      <EmptyState title={he.studentExamsDoneEmpty} icon={<HistoryEduIcon />} />
    );

  return (
    <Box sx={{ width: "100%" }} dir="rtl">
      <ListPageToolbar title={he.exams} subtitle={he.activeExams} titleVariant="h5" />
      <StudentLanguageSetting />
      {data.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => data.setError("")}>{data.error}</Alert>}
      {data.loading ? (
        <Skeleton variant="rounded" height={220} />
      ) : (
        <>
          <StudentExamTabs value={tab} pendingCount={data.pending.length} doneCount={data.done.length} onChange={setTab} />
          <StudentExamList sessions={rows} showCourse highlightedId={highlighted} empty={empty} onOpen={(id) => navigate(`/student/exams/${id}`)} />
        </>
      )}
    </Box>
  );
}
