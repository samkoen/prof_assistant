import { Box, Button, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { he } from "../../i18n/he";
import { softCardShadow, statusTones } from "../../theme/brand";

/** Confirmation affichée après l'envoi du message. */
export default function ContactSent({ onAnother }: { onAnother: () => void }) {
  const tone = statusTones.success;
  return (
    <Box dir="rtl" sx={{ maxWidth: 640, p: 3, borderRadius: 3, bgcolor: "background.paper", boxShadow: softCardShadow }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: tone.fg }}>
        <CheckCircleIcon />
        <Typography variant="h6" fontWeight={800}>{he.contactSentTitle}</Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>{he.contactSentHint}</Typography>
      <Button variant="outlined" onClick={onAnother}>{he.contactSendAnother}</Button>
    </Box>
  );
}
