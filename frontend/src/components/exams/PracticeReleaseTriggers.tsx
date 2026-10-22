import { Button, IconButton, Tooltip } from "@mui/material";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import { he } from "../../i18n/he";
import type { PracticeReleaseActions } from "../../utils/practiceRelease";
import LoadingButton from "../ui/LoadingButton";

export type ReleaseKind = "deploy" | "block" | "unlock";

export type ReleaseTriggersProps = {
  actions: PracticeReleaseActions;
  loading: boolean;
  onPick: (kind: ReleaseKind) => void;
};

const deployIconSx = {
  color: "common.white",
  bgcolor: "success.main",
  "&:hover": { bgcolor: "success.dark" },
  "&.Mui-disabled": { bgcolor: "action.disabledBackground", color: "action.disabled" },
} as const;

function DeployIcon({ blocked, loading, onPick }: { blocked: boolean; loading: boolean; onPick: () => void }) {
  return (
    <Tooltip title={blocked ? he.deployNeedsContent : he.deployToStudents}>
      <span>
        <IconButton size="small" aria-label={he.deployToStudents} disabled={blocked || loading} onClick={onPick} sx={deployIconSx}>
          <RocketLaunchOutlinedIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );
}

/** Cadenas ouvert = note libre (clic : bloquer) ; cadenas fermé = note bloquée (clic : rendre). */
function GradingLockIcon({ locked, loading, onPick }: { locked: boolean; loading: boolean; onPick: () => void }) {
  const label = locked ? he.unlockGradingHint : he.blockGrading;
  return (
    <Tooltip title={label}>
      <span>
        <IconButton size="small" color={locked ? "warning" : "default"} aria-label={label} disabled={loading} onClick={onPick}>
          {locked ? <LockOutlinedIcon fontSize="small" /> : <LockOpenOutlinedIcon fontSize="small" />}
        </IconButton>
      </span>
    </Tooltip>
  );
}

/** Variante icônes + tooltip (tableaux denses). L'envoi, action principale, est plein et vert. */
export function IconTriggers({ actions, loading, onPick }: ReleaseTriggersProps) {
  return (
    <>
      {(actions.deploy || actions.deployBlocked) && (
        <DeployIcon blocked={actions.deployBlocked} loading={loading} onPick={() => onPick("deploy")} />
      )}
      {actions.block && <GradingLockIcon locked={false} loading={loading} onPick={() => onPick("block")} />}
      {actions.unlock && <GradingLockIcon locked loading={loading} onPick={() => onPick("unlock")} />}
    </>
  );
}

/** Variante boutons texte (cartes). */
export function ButtonTriggers({ actions, loading, onPick }: ReleaseTriggersProps) {
  return (
    <>
      {actions.deploy && (
        <LoadingButton size="small" variant="contained" color="success" startIcon={<RocketLaunchOutlinedIcon />} loading={loading} onClick={() => onPick("deploy")}>
          {he.deployToStudents}
        </LoadingButton>
      )}
      {actions.deployBlocked && (
        <Tooltip title={he.deployNeedsContent}>
          <span>
            <Button size="small" variant="contained" disabled startIcon={<RocketLaunchOutlinedIcon />}>{he.deployToStudents}</Button>
          </span>
        </Tooltip>
      )}
      {actions.block && (
        <LoadingButton size="small" variant="outlined" color="warning" startIcon={<LockOpenOutlinedIcon />} loading={loading} onClick={() => onPick("block")}>
          {he.blockGrading}
        </LoadingButton>
      )}
      {actions.unlock && (
        <LoadingButton size="small" variant="outlined" color="warning" startIcon={<LockOutlinedIcon />} loading={loading} onClick={() => onPick("unlock")}>
          {he.unlockGrading}
        </LoadingButton>
      )}
    </>
  );
}
