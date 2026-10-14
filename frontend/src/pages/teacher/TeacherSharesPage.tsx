import { useState } from "react";
import { Alert, Box, Skeleton, Stack } from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import AcceptTeacherShareDialog from "../../components/AcceptTeacherShareDialog";
import ListPageToolbar from "../../components/ListPageToolbar";
import OfferingTeacherInvitesSection from "../../components/OfferingTeacherInvitesSection";
import IncomingShareCard from "../../components/teacher/IncomingShareCard";
import SentSharesList from "../../components/teacher/SentSharesList";
import EmptyState from "../../components/ui/EmptyState";
import SectionHeader from "../../components/ui/SectionHeader";
import type { TeacherShare } from "../../api/client";
import { useTeacherShares } from "../../hooks/useTeacherShares";
import { he } from "../../i18n/he";

/** Partages reçus et envoyés. L'élève n'a pas les invitations de co-enseignement. */
export default function TeacherSharesPage({ audience = "teacher" }: { audience?: "teacher" | "student" }) {
  const data = useTeacherShares();
  const [acceptShare, setAcceptShare] = useState<TeacherShare | null>(null);
  const student = audience === "student";

  return (
    <Box sx={{ width: "100%" }} dir="rtl">
      <ListPageToolbar
        title={student ? he.studentShares : he.teacherShares}
        subtitle={student ? he.studentSharesSubtitle : he.teacherSharesSubtitle}
        titleVariant="h5"
      />
      {data.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => data.setError("")}>{data.error}</Alert>}
      {data.loading ? (
        <Skeleton variant="rounded" height={220} />
      ) : (
        <>
          <SectionHeader title={he.incomingShares} />
          {data.pendingIncoming.length === 0 ? (
            <Box sx={{ mb: 4 }}>
              <EmptyState title={he.noIncomingShares} description={he.sharesIncomingEmptyHint} icon={<InboxOutlinedIcon />} />
            </Box>
          ) : (
            <Stack spacing={1.5} sx={{ mb: 4 }}>
              {data.pendingIncoming.map((share) => (
                <IncomingShareCard
                  key={share.id}
                  share={share}
                  declining={data.decliningId === share.id}
                  onAccept={setAcceptShare}
                  onDecline={data.decline}
                />
              ))}
            </Stack>
          )}
          <SectionHeader title={he.sentShares} />
          <SentSharesList shares={data.sentSorted} />
          {!student && <OfferingTeacherInvitesSection onError={data.setError} />}
        </>
      )}
      <AcceptTeacherShareDialog
        share={acceptShare}
        open={!!acceptShare}
        onClose={() => setAcceptShare(null)}
        onAccepted={data.reload}
      />
    </Box>
  );
}
