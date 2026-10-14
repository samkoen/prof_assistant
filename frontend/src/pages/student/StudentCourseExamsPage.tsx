import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Skeleton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import ShareIcon from "@mui/icons-material/Share";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import ListPageToolbar from "../../components/ListPageToolbar";
import StudentExamList from "../../components/student/StudentExamList";
import StudentExamTabs, { type StudentExamsTab } from "../../components/student/StudentExamTabs";
import StudentLanguageSetting from "../../components/student/StudentLanguageSetting";
import EmptyState from "../../components/ui/EmptyState";
import { offeringLabel, type StudentExamSessionWithAttempt } from "../../api/client";
import {
  PersonalCourseButtons,
  PersonalShareDialog,
  tirgoulEditPath,
  usePersonalShares,
} from "../../components/student/PersonalCourseActions";
import { useFocusSession } from "../../hooks/useFocusSession";
import { useStudentOfferingExams } from "../../hooks/useStudentOfferingExams";
import { he } from "../../i18n/he";

/** Examens d'un cours : à faire / terminés, avec retour mis en évidence depuis un examen. */
export default function StudentCourseExamsPage() {
  const id = Number(useParams<{ offeringId: string }>().offeringId);
  const navigate = useNavigate();
  const data = useStudentOfferingExams(id);
  const shares = usePersonalShares(data.offering);
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
      <ListPageToolbar
        title={he.courseExams}
        subtitle={data.offering ? offeringLabel(data.offering) : undefined}
        titleVariant="h5"
        actions={data.offering?.is_personal ? <PersonalCourseButtons offering={data.offering} onShare={shares.shareSubject} /> : undefined}
      />
      <StudentLanguageSetting />
      {data.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => data.setError("")}>{data.error}</Alert>}
      {shares.notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => shares.setNotice("")}>{shares.notice}</Alert>}
      {pendingEnrollment && <Alert severity="warning" sx={{ mb: 2 }}>{he.enrollmentPendingHint}</Alert>}
      {data.loading ? (
        <Skeleton variant="rounded" height={220} />
      ) : (
        <>
          <StudentExamTabs value={tab} pendingCount={data.pending.length} doneCount={data.done.length} onChange={setTab} />
          <StudentExamList
            sessions={rows}
            highlightedId={highlighted}
            empty={empty}
            onOpen={(sid) => navigate(`/student/exams/${sid}`)}
            extraFor={data.offering?.is_personal ? (session) => <TirgoulRowActions offeringId={id} session={session} onShare={shares.shareExam} /> : undefined}
          />
        </>
      )}
      <PersonalShareDialog
        target={shares.target}
        onClose={() => shares.setTarget(null)}
        onSent={() => {
          shares.setNotice(he.shareSentToRecipient);
          shares.setTarget(null);
        }}
      />
    </Box>
  );
}

function TirgoulRowActions({
  offeringId,
  session,
  onShare,
}: {
  offeringId: number;
  session: StudentExamSessionWithAttempt;
  onShare: (session: StudentExamSessionWithAttempt) => void;
}) {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-start", px: 2, pb: 1.5 }}>
      <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(tirgoulEditPath(offeringId, session.exam_id))}>
        {he.editTirgoul}
      </Button>
      <Button size="small" startIcon={<ShareIcon />} onClick={() => onShare(session)}>
        {he.shareTirgoul}
      </Button>
    </Box>
  );
}
