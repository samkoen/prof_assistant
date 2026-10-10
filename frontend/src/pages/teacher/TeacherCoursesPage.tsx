import { useMemo, useState } from "react";
import { Alert, Box, Skeleton } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { OfferingCardGrid } from "../../components/CourseCardGrid/CourseCardGrid";
import CreateOfferingDialog from "../../components/courses/CreateOfferingDialog";
import { OfferingFooterActions, OfferingHeaderActions, PendingBadge } from "../../components/courses/OfferingCardActions";
import OfferingFilters from "../../components/courses/OfferingFilters";
import InviteOfferingTeacherDialog from "../../components/InviteOfferingTeacherDialog";
import ListPageToolbar from "../../components/ListPageToolbar";
import OfferingTeachersDialog from "../../components/OfferingTeachersDialog";
import EmptyState from "../../components/ui/EmptyState";
import { offeringLabel, type CourseOffering } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCreateOffering } from "../../hooks/useCreateOffering";
import { useTeacherOfferings } from "../../hooks/useTeacherOfferings";
import { he } from "../../i18n/he";
import { filterOfferings, sortOfferings, type SemesterFilter } from "../../utils/offeringsList";

/** « הקורסים שלי » : groupes triés du plus récent, recherche, accès direct aux élèves et examens. */
export default function TeacherCoursesPage() {
  const { user } = useAuth();
  const data = useTeacherOfferings();
  const create = useCreateOffering(data.reload, data.setError);
  const [query, setQuery] = useState("");
  const [semester, setSemester] = useState<SemesterFilter>("all");
  const [inviteOffering, setInviteOffering] = useState<CourseOffering | null>(null);
  const [manageOffering, setManageOffering] = useState<CourseOffering | null>(null);
  const visible = useMemo(() => sortOfferings(filterOfferings(data.offerings, query, semester)), [data.offerings, query, semester]);

  return (
    <Box dir="rtl" sx={{ width: "100%", minWidth: 0 }}>
      <ListPageToolbar title={he.myCourses} subtitle={he.offeringSubtitle} addLabel={he.createOffering} onAdd={create.openDialog} />
      {data.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => data.setError("")}>{data.error}</Alert>}
      {data.offerings.length > 0 && <OfferingFilters query={query} semester={semester} onQueryChange={setQuery} onSemesterChange={setSemester} />}
      {data.loading ? (
        <Skeleton variant="rounded" height={220} />
      ) : data.offerings.length === 0 ? (
        <EmptyState title={he.coursesEmptyTitle} description={he.coursesEmptyHint} icon={<SchoolOutlinedIcon />} />
      ) : (
        <OfferingCardGrid
          offerings={visible}
          emptyMessage={he.coursesNoMatch}
          renderActions={(o) => <OfferingHeaderActions offering={o} userId={user?.id} onManageTeachers={setManageOffering} onInvite={setInviteOffering} />}
          renderFooter={(o) => <OfferingFooterActions offering={o} />}
          renderBadge={(o) => <PendingBadge count={data.pendingByOffering[o.id] ?? 0} />}
        />
      )}
      <CreateOfferingDialog state={create} />
      <InviteOfferingTeacherDialog
        open={!!inviteOffering}
        offeringId={inviteOffering?.id ?? null}
        itemLabel={inviteOffering ? offeringLabel(inviteOffering) : ""}
        onClose={() => setInviteOffering(null)}
        onSent={data.reload}
      />
      <OfferingTeachersDialog open={!!manageOffering} offeringId={manageOffering?.id ?? null} userId={user?.id} onClose={() => setManageOffering(null)} onChanged={data.reload} />
    </Box>
  );
}
