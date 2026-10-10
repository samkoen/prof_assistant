import { alpha, Box, Button, Paper, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import type { TeacherShare } from "../../api/client";
import { he } from "../../i18n/he";
import { brand, softCardShadow } from "../../theme/brand";
import { shareSummary } from "../../utils/teacherShares";

type IncomingShareCardProps = {
  share: TeacherShare;
  declining: boolean;
  onAccept: (share: TeacherShare) => void;
  onDecline: (id: number) => void;
};

/** Carte d'un partage reçu : expéditeur, contenu, accepter / refuser. */
export default function IncomingShareCard({ share, declining, onAccept, onDecline }: IncomingShareCardProps) {
  return (
    <Paper
      dir="rtl"
      sx={{
        p: 2,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
        borderRadius: 3,
        boxShadow: softCardShadow,
        borderInlineStart: `4px solid ${brand.amber500}`,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(brand.violet600, 0.1),
          color: brand.violet600,
        }}
      >
        <InboxIcon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 180 }}>
        <Typography fontWeight={700}>{shareSummary(share)}</Typography>
        <Typography variant="body2" color="text.secondary">
          {he.teacher}: {share.sender_name}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button variant="contained" size="small" onClick={() => onAccept(share)} disabled={declining}>
          {he.acceptShare}
        </Button>
        <Button variant="outlined" color="inherit" size="small" onClick={() => onDecline(share.id)} disabled={declining}>
          {he.declineShare}
        </Button>
      </Box>
    </Paper>
  );
}
