import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import TimerIcon from "@mui/icons-material/AccessTime";
import { he } from "../../../i18n/he";
import { statusTones, type StatusTone } from "../../../theme/brand";
import type { TimerLevel } from "../../../utils/examTake";

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(185, 28, 28, 0.35); }
  50% { box-shadow: 0 0 0 6px rgba(185, 28, 28, 0); }
`;

const LEVEL_TONE: Record<TimerLevel, StatusTone> = { normal: "violet", warning: "warning", critical: "danger" };

type ExamTimerChipProps = { timeLeft: string; level: TimerLevel };

/** Minuteur : violet au repos, ambre sous le seuil du professeur, rouge pulsé dans la dernière minute. */
export default function ExamTimerChip({ timeLeft, level }: ExamTimerChipProps) {
  const tone = statusTones[LEVEL_TONE[level]];
  return (
    <Box
      role="timer"
      aria-label={he.examTimerAria}
      title={he.timeRemaining}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: 999,
        bgcolor: tone.bg,
        color: tone.fg,
        fontWeight: 800,
        fontSize: "1.05rem",
        fontVariantNumeric: "tabular-nums",
        flexShrink: 0,
        animation: level === "critical" ? `${pulse} 1.2s ease-in-out infinite` : undefined,
      }}
    >
      <TimerIcon sx={{ fontSize: 20 }} />
      <Box component="span" dir="ltr">{timeLeft || "--:--"}</Box>
    </Box>
  );
}
