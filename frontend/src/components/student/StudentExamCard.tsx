import { alpha, Box, CardActionArea, LinearProgress, Paper, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import StatusChip from "../ui/StatusChip";
import type { StudentExamSessionWithAttempt } from "../../api/client";
import { he } from "../../i18n/he";
import { brand, softCardShadow, statusTones } from "../../theme/brand";
import { examSessionRowId } from "../../utils/studentCourseExamsNav";
import { scorePercent, scoreTone, studentExamView } from "../../utils/studentExams";

type StudentExamCardProps = {
  session: StudentExamSessionWithAttempt;
  /** Affiche « cours — groupe » sous le titre (liste globale). */
  showCourse?: boolean;
  highlighted?: boolean;
  onOpen: (sessionId: number) => void;
};

function ScoreBar({ attempt }: { attempt: StudentExamSessionWithAttempt["attempt"] }) {
  const percent = scorePercent(attempt);
  if (percent === null || !attempt) return null;
  const color = statusTones[scoreTone(percent)].fg;
  return (
    <Box sx={{ mt: 1.25, maxWidth: 360 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" fontWeight={700}>
          {he.yourScore}: {attempt.score} / {attempt.max_score}
        </Typography>
        <Typography variant="caption" fontWeight={800} sx={{ color }}>
          {percent}%
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 4, bgcolor: alpha(color, 0.14), "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 } }} />
    </Box>
  );
}

function ActionHint({ label, openable, pending }: { label: string; openable: boolean; pending: boolean }) {
  const Icon = openable ? ArrowBackIcon : LockOutlinedIcon;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0, fontWeight: 800, color: pending ? brand.violet700 : "text.secondary" }}>
      <Typography variant="body2" fontWeight={800} color="inherit">
        {label}
      </Typography>
      <Icon fontSize="small" />
    </Box>
  );
}

function metaLine(session: StudentExamSessionWithAttempt, showCourse: boolean): string {
  const questions = `${session.question_count} ${he.questionsCount}`;
  return showCourse ? `${session.catalog_name} · ${session.group_name} · ${questions}` : questions;
}

/** Carte d'un examen côté élève : état, titre, score éventuel et action claire. */
export default function StudentExamCard({ session, showCourse = false, highlighted = false, onOpen }: StudentExamCardProps) {
  const view = studentExamView(session, session.attempt);
  const tone = statusTones[view.tone];
  return (
    <Paper
      id={examSessionRowId(session.id)}
      dir="rtl"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: highlighted ? `0 0 0 3px ${alpha(brand.amber500, 0.55)}` : softCardShadow,
        borderInlineStart: `5px solid ${tone.fg}`,
        opacity: view.openable ? 1 : 0.72,
        transition: "box-shadow 0.3s ease, transform 0.15s ease",
        "&:hover": view.openable ? { transform: "translateY(-2px)" } : undefined,
      }}
    >
      <CardActionArea disabled={!view.openable} onClick={() => onOpen(session.id)} aria-label={view.actionLabel} sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0, flex: 1, textAlign: "right" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
            <StatusChip label={view.label} tone={view.tone} />
            {session.is_tirgoul && <StatusChip label={he.tirgoulChip} tone="info" />}
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.35 }}>
            {session.exam_title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metaLine(session, showCourse)}
          </Typography>
          <ScoreBar attempt={session.attempt} />
        </Box>
        <ActionHint label={view.actionLabel} openable={view.openable} pending={view.pending} />
      </CardActionArea>
    </Paper>
  );
}
