import { Box, Button, Paper, Typography } from "@mui/material";
import StatusChip from "../ui/StatusChip";
import { offeringLabel, type CourseOffering } from "../../api/client";
import { he } from "../../i18n/he";
import { softCardShadow } from "../../theme/brand";
import { offeringTeacherNames } from "../../utils/offeringTeachers";

type OfferingJoinCardProps = {
  offering: CourseOffering;
  joining: boolean;
  onJoin: (offering: CourseOffering) => void;
};

function JoinAction({ offering, joining, onJoin }: OfferingJoinCardProps) {
  if (offering.enrollment_status === "approved") return <StatusChip label={he.enrollmentApprovedStatus} tone="success" />;
  if (offering.enrollment_status === "pending") return <StatusChip label={he.enrollmentPendingApproval} tone="warning" />;
  return (
    <Button variant="contained" size="small" onClick={() => onJoin(offering)} disabled={joining}>
      {joining ? he.loading : he.joinCourse}
    </Button>
  );
}

/** Cours ouvert à l'inscription : intitulé, professeur(s), description et action (rejoindre / état). */
export default function OfferingJoinCard(props: OfferingJoinCardProps) {
  const { offering } = props;
  return (
    <Paper dir="rtl" sx={{ p: 2.5, borderRadius: 3, boxShadow: softCardShadow, height: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="subtitle1" fontWeight={800}>
        {offeringLabel(offering)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {offeringTeacherNames(offering)}
      </Typography>
      {offering.description && (
        <Typography variant="body2" color="text.secondary">
          {offering.description}
        </Typography>
      )}
      <Box sx={{ mt: "auto", pt: 1 }}>
        <JoinAction {...props} />
      </Box>
    </Paper>
  );
}
