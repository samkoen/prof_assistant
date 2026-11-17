import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import TerminalIcon from "@mui/icons-material/Terminal";
import type { GeminiAnswerCheck } from "../../../types/geminiQuestionSeries";
import type { CheckResolution } from "../../../utils/answerChecks";
import { he } from "../../../i18n/he";
import { statusTones } from "../../../theme/brand";

type AnswerCheckPanelProps = {
  check: GeminiAnswerCheck;
  canUseChecked: boolean;
  becomesMultiple?: boolean;
  resolution?: CheckResolution;
  onResolve: (resolution: CheckResolution | undefined) => void;
};

const letters = (list: string[]) => list.join(", ");

function VerifiedChip({ computed }: { computed: boolean }) {
  const label = computed ? `${he.answerCheckVerified} · ${he.answerCheckComputed}` : he.answerCheckVerified;
  return (
    <Chip
      size="small"
      icon={computed ? <TerminalIcon /> : <CheckCircleOutlineIcon />}
      label={label}
      sx={{ bgcolor: statusTones.success.bg, color: statusTones.success.fg, "& .MuiChip-icon": { color: "inherit" } }}
    />
  );
}

function UncheckedChip() {
  return (
    <Chip
      size="small"
      icon={<HelpOutlineIcon />}
      label={he.answerCheckUnchecked}
      sx={{ bgcolor: statusTones.neutral.bg, color: statusTones.neutral.fg, "& .MuiChip-icon": { color: "inherit" } }}
    />
  );
}

function Detail({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
      <b>{label}:</b> {text}
    </Typography>
  );
}

function useCheckedText(check: GeminiAnswerCheck, becomesMultiple: boolean, chosen: boolean): string {
  const shown = letters(check.checked);
  if (chosen) return becomesMultiple ? he.answerCheckChoseUseMultiple(shown) : he.answerCheckChoseUse(shown);
  return becomesMultiple ? he.answerCheckUseMultiple(shown) : he.answerCheckUse(shown);
}

function Decision({ check, canUseChecked, becomesMultiple = false, resolution, onResolve }: AnswerCheckPanelProps) {
  if (resolution) {
    const text = resolution === "checked"
      ? useCheckedText(check, becomesMultiple, true)
      : he.answerCheckChoseKeep(letters(check.generated));
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
        <Typography variant="body2" fontWeight={600}>{text}</Typography>
        <Button size="small" onClick={() => onResolve(undefined)}>{he.answerCheckChange}</Button>
      </Box>
    );
  }
  return (
    <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
      <Button size="small" variant="outlined" onClick={() => onResolve("generated")}>
        {he.answerCheckKeep(letters(check.generated))}
      </Button>
      {canUseChecked && (
        <Button size="small" variant="contained" onClick={() => onResolve("checked")}>
          {useCheckedText(check, becomesMultiple, false)}
        </Button>
      )}
    </Box>
  );
}

/** Verdict de la double vérification sous une question générée ; en cas de désaccord, le prof tranche. */
export default function AnswerCheckPanel(props: AnswerCheckPanelProps) {
  const { check } = props;
  if (check.status === "verified") return <Box sx={{ mt: 1 }}><VerifiedChip computed={check.computed} /></Box>;
  if (check.status === "unchecked") return <Box sx={{ mt: 1 }}><UncheckedChip /></Box>;
  return (
    <Alert severity={props.resolution ? "info" : "warning"} sx={{ mt: 1.25, alignItems: "flex-start" }}>
      <Typography variant="body2" fontWeight={700}>{he.answerCheckMismatchTitle}</Typography>
      <Typography variant="body2">
        {he.answerCheckMarked(letters(check.generated))} · {check.checked.length ? he.answerCheckFound(letters(check.checked)) : he.answerCheckFoundNone}
      </Typography>
      <Detail label={he.answerCheckReason} text={check.reason} />
      <Detail label={he.answerCheckSolution} text={check.solution} />
      <Decision {...props} />
    </Alert>
  );
}
