import { Box, Paper, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import EmptyState from "../ui/EmptyState";
import StatusChip from "../ui/StatusChip";
import type { TeacherShare } from "../../api/client";
import { he } from "../../i18n/he";
import { softCardShadow } from "../../theme/brand";
import { shareStatusView, shareSummary } from "../../utils/teacherShares";

/** Partages envoyés : destinataire, contenu et statut coloré. */
export default function SentSharesList({ shares }: { shares: TeacherShare[] }) {
  if (shares.length === 0) {
    return <EmptyState title={he.sharesSentEmpty} description={he.sharesSentEmptyHint} icon={<SendIcon />} />;
  }
  return (
    <Paper dir="rtl" sx={{ borderRadius: 3, boxShadow: softCardShadow, overflow: "hidden" }}>
      {shares.map((row, i) => {
        const view = shareStatusView(row.status);
        return (
          <Box
            key={row.id}
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderTop: i === 0 ? "none" : "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={600} noWrap>
                {shareSummary(row)}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {he.teacher}: {row.recipient_name}
              </Typography>
            </Box>
            <StatusChip label={view.label} tone={view.tone} />
          </Box>
        );
      })}
    </Paper>
  );
}
