import { Link as RouterLink } from "react-router-dom";
import { Button, Tooltip } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GradingIcon from "@mui/icons-material/GradingOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PublishIcon from "@mui/icons-material/CampaignOutlined";
import LoadingButton from "../ui/LoadingButton";
import { he } from "../../i18n/he";
import { primaryActionLabel, type PrimaryActionKind } from "../../utils/examPrimaryAction";

type ExamPrimaryButtonProps = {
  kind: PrimaryActionKind;
  loading?: boolean;
  gradesPath?: string;
  size?: "small" | "medium";
  onActivate?: () => void;
  onClose?: () => void;
  onPublish?: () => void;
};

const ICONS: Partial<Record<PrimaryActionKind, JSX.Element>> = {
  activate: <PlayArrowIcon />,
  activateBlocked: <PlayArrowIcon />,
  close: <DoneAllIcon />,
  publish: <PublishIcon />,
  grades: <GradingIcon />,
};

function BlockedActivate({ size }: { size: "small" | "medium" }) {
  return (
    <Tooltip title={he.noQuestionsYet}>
      <span>
        <Button size={size} variant="contained" disabled startIcon={ICONS.activateBlocked}>
          {he.activateExam}
        </Button>
      </span>
    </Tooltip>
  );
}

/** Le bouton principal d'une מטלה : un seul, libellé explicite, selon son état. */
export default function ExamPrimaryButton({ kind, loading, gradesPath, size = "small", onActivate, onClose, onPublish }: ExamPrimaryButtonProps) {
  if (kind === "none") return null;
  if (kind === "activateBlocked") return <BlockedActivate size={size} />;
  if (kind === "grades") {
    return (
      <Button size={size} variant="outlined" component={RouterLink} to={gradesPath ?? ""} startIcon={ICONS.grades} disabled={!gradesPath}>
        {he.viewExamGrades}
      </Button>
    );
  }
  const handlers: Partial<Record<PrimaryActionKind, (() => void) | undefined>> = { activate: onActivate, close: onClose, publish: onPublish };
  return (
    <LoadingButton size={size} variant="contained" startIcon={ICONS[kind]} loading={loading} onClick={handlers[kind]}>
      {primaryActionLabel(kind)}
    </LoadingButton>
  );
}
