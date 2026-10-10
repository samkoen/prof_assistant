import type { AiCreditPack } from "../../utils/aiCredits";
import { he } from "../../i18n/he";

/** Libellé d'un pack RTL : « 15 קרדיטים — 69 ₪ », chaque nombre isolé pour ne pas être réordonné. */
export default function PackLabel({ pack }: { pack: Pick<AiCreditPack, "credits" | "price_ils"> }) {
  return (
    <span dir="rtl">
      <bdi>{pack.credits}</bdi> {he.aiCreditsUnit} — <bdi>{pack.price_ils}</bdi> {he.shekelSign}
    </span>
  );
}
