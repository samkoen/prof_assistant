import { Box, Chip, Tooltip } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { he } from "../../../i18n/he";
import { toggleRole, type SourceRole } from "../../../utils/geminiSourceRole";

type SourceRoleChipsProps = {
  roles: SourceRole[];
  disabled?: boolean;
  onChange: (roles: SourceRole[]) => void;
};

const ROLE_OPTIONS: { role: SourceRole; label: string; hint: string }[] = [
  { role: "content", label: he.geminiSourceRoleContent, hint: he.geminiSourceUseContent },
  { role: "style", label: he.geminiSourceRoleStyle, hint: he.geminiSourceUseStyle },
];

/** Choix du/des rôles d'un fichier : puce pleine + ✓ = actif, puce vide = inactif (cumulables). */
export default function SourceRoleChips({ roles, disabled, onChange }: SourceRoleChipsProps) {
  return (
    <Box dir="rtl" role="group" aria-label={he.geminiSourceRoleLabel} sx={{ display: "flex", gap: 0.75 }}>
      {ROLE_OPTIONS.map(({ role, label, hint }) => {
        const active = roles.includes(role);
        return (
          <Tooltip key={role} title={hint}>
            <span>
              <Chip
                label={label}
                clickable
                disabled={disabled}
                aria-pressed={active}
                icon={active ? <CheckIcon /> : undefined}
                color={active ? "primary" : "default"}
                variant={active ? "filled" : "outlined"}
                onClick={() => onChange(toggleRole(roles, role))}
                sx={{ fontWeight: 700, borderRadius: 999 }}
              />
            </span>
          </Tooltip>
        );
      })}
    </Box>
  );
}
