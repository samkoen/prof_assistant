import { Alert, Box, Drawer, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Spinner from "../ui/Spinner";
import TutorComposer from "./TutorComposer";
import TutorMessageList from "./TutorMessageList";
import { useTutorThread } from "./useTutorThread";
import { AiCreditBalance, useAiCreditsPaywall } from "../AiCreditsPaywall";
import { STUDENT_AI_PRODUCT } from "../../utils/aiCredits";
import { he } from "../../i18n/he";
import { surface } from "../../theme/brand";

interface AiTutorDrawerProps {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  questionId: number;
  questionLabel: string;
  isCorrect: boolean | null;
  forPractice: boolean;
  dir: "rtl" | "ltr";
}

function DrawerHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 2, borderBottom: `1px solid ${surface.border}` }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {subtitle}
        </Typography>
      </Box>
      <IconButton size="small" aria-label={he.tutorClose} onClick={onClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

/** Chat du tuteur : panneau latéral sur desktop, bottom sheet sur mobile. */
export default function AiTutorDrawer(props: AiTutorDrawerProps) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const paywall = useAiCreditsPaywall();
  const tutor = useTutorThread({ ...props, onCreditsError: paywall.openFromError });
  const thread = tutor.thread;
  const paperSx = mobile
    ? { height: "85vh", borderTopLeftRadius: 16, borderTopRightRadius: 16 }
    : { width: 420, maxWidth: "100vw" };
  return (
    <Drawer anchor={mobile ? "bottom" : "right"} open={props.open} onClose={props.onClose} PaperProps={{ sx: { ...paperSx, display: "flex", flexDirection: "column" } }}>
      {paywall.dialog}
      <Box dir="rtl" sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        <DrawerHeader title={he.tutorTitle} subtitle={props.questionLabel} onClose={props.onClose} />
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {he.tutorPrivacyNote}
          </Typography>
          {thread && !thread.charged && (
            <>
              <Typography variant="caption" color="text.secondary" display="block">
                {he.tutorCostNote}
              </Typography>
              <AiCreditBalance product={STUDENT_AI_PRODUCT} />
            </>
          )}
        </Box>
        <Box sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: surface.page }}>
          {tutor.loading ? <Spinner size={24} /> : <TutorMessageList messages={thread?.messages ?? []} pending={tutor.pending} dir={props.dir} />}
        </Box>
        {tutor.error && (
          <Alert severity="error" sx={{ mx: 1.5, mt: 1 }} onClose={() => tutor.setError("")}>
            {tutor.error}
          </Alert>
        )}
        {thread && (
          <TutorComposer
            isCorrect={props.isCorrect}
            started={thread.messages.length > 0}
            remaining={Math.min(thread.remaining_messages, thread.exam_remaining_messages)}
            maxChars={thread.max_message_chars}
            busy={tutor.sending}
            onSend={tutor.send}
          />
        )}
      </Box>
    </Drawer>
  );
}
