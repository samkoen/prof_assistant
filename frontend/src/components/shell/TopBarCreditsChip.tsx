import { Link } from "react-router-dom";
import { Box, Chip, Tooltip } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import type { WalletBalance } from "../../api/billing";
import { PROFILE_PATH } from "../../config/menuItems";
import { he } from "../../i18n/he";
import { statusTones } from "../../theme/brand";
import { creditsAreLow } from "../../utils/teacherDashboard";

export function creditsChipLabel(wallet: WalletBalance): string {
  return wallet.unlimited ? he.statUnlimited : String(wallet.total);
}

/** Solde de crédits AI toujours visible ; passe à l'ambre quand il est presque épuisé. */
export default function TopBarCreditsChip({ wallet }: { wallet: WalletBalance }) {
  const tone = creditsAreLow(wallet.total, wallet.unlimited) ? statusTones.warning : statusTones.primary;
  return (
    <Tooltip title={he.topBarCreditsTitle}>
      <Chip
        component={Link}
        to={PROFILE_PATH}
        clickable
        icon={<AutoAwesomeIcon sx={{ fontSize: 18, color: `${tone.fg} !important` }} />}
        label={
          <span dir="rtl">
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {he.statAiCredits}
              {"\u200F"}:{" "}
            </Box>
            <bdi>{creditsChipLabel(wallet)}</bdi>
          </span>
        }
        sx={{
          bgcolor: tone.bg,
          color: tone.fg,
          fontWeight: 600,
          // MUI pose margin-right: -6 sur l'icône (prévu pour le LTR). En RTL l'icône
          // est à droite, donc cette marge négative la sort du fond. On la rentre.
          "&& .MuiChip-icon": { marginLeft: "4px", marginRight: "8px" },
          "&:hover": { bgcolor: tone.bg, filter: "brightness(0.96)" },
        }}
      />
    </Tooltip>
  );
}
