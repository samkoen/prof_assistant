import { Link } from "react-router-dom";
import { Chip, Tooltip } from "@mui/material";
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
  const tone = creditsAreLow(wallet.total, wallet.unlimited) ? statusTones.warning : statusTones.violet;
  return (
    <Tooltip title={he.topBarCreditsTitle}>
      <Chip
        component={Link}
        to={PROFILE_PATH}
        clickable
        icon={<AutoAwesomeIcon sx={{ fontSize: 18, color: `${tone.fg} !important` }} />}
        label={
          <span dir="rtl">
            {he.statAiCredits}
            {"\u200F"}: <bdi>{creditsChipLabel(wallet)}</bdi>
          </span>
        }
        sx={{ bgcolor: tone.bg, color: tone.fg, fontWeight: 700, "&:hover": { bgcolor: tone.bg, filter: "brightness(0.96)" } }}
      />
    </Tooltip>
  );
}
