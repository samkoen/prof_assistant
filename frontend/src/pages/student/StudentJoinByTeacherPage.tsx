import { useState } from "react";
import { Alert, Box, Button, Grid2 as Grid, Skeleton, Typography } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import JoinCourseQrScannerDialog from "../../components/JoinCourseQrScannerDialog";
import ListPageToolbar from "../../components/ListPageToolbar";
import JoinMethodCards from "../../components/student/JoinMethodCards";
import OfferingJoinCard from "../../components/student/OfferingJoinCard";
import EmptyState from "../../components/ui/EmptyState";
import type { TeacherOpenOfferings } from "../../api/client";
import { useJoinByTeacher } from "../../hooks/useJoinByTeacher";
import { he } from "../../i18n/he";

function TeacherHeader({ result, onChange }: { result: TeacherOpenOfferings; onChange: () => void }) {
  return (
    <Box sx={{ mb: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
      <Box>
        <Typography variant="h6" fontWeight={800}>
          {he.teacherCoursesFor(result.teacher_name)}
        </Typography>
        <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "right" }}>
          {result.teacher_email}
        </Typography>
      </Box>
      <Button size="small" variant="outlined" onClick={onChange}>
        {he.changeTeacher}
      </Button>
    </Box>
  );
}

/** Rejoindre un cours : scan du QR du prof ou recherche par e-mail, puis demande d'inscription. */
export default function StudentJoinByTeacherPage() {
  const join = useJoinByTeacher();
  const [scannerOpen, setScannerOpen] = useState(false);
  const { result } = join;

  return (
    <Box sx={{ width: "100%" }} dir="rtl">
      <ListPageToolbar title={he.joinByTeacherTitle} subtitle={he.joinByTeacherSubtitle} titleVariant="h5" />
      {join.message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => join.setMessage("")}>{join.message}</Alert>}
      {join.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => join.setError("")}>{join.error}</Alert>}
      {!result ? (
        <>
          <JoinMethodCards email={join.email} searching={join.searching} onEmailChange={join.setEmail} onSearch={join.search} onScan={() => setScannerOpen(true)} />
          {join.searching && <Skeleton variant="rounded" height={96} sx={{ mt: 3 }} />}
        </>
      ) : (
        <>
          <TeacherHeader result={result} onChange={join.reset} />
          {result.offerings.length === 0 ? (
            <EmptyState title={he.noTeacherOpenCourses} icon={<SchoolIcon />} />
          ) : (
            <Grid container spacing={2.5}>
              {result.offerings.map((o) => (
                <Grid key={o.id} size={{ xs: 12, md: 6 }}>
                  <OfferingJoinCard offering={o} joining={join.joiningId === o.id} onJoin={join.join} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      <JoinCourseQrScannerDialog open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </Box>
  );
}
