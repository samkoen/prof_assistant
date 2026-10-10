import { Box, Typography } from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";
import { useRoleCredits } from "../../../hooks/useRoleCredits";
import { he } from "../../../i18n/he";
import { statusTones } from "../../../theme/brand";
import type { GeminiGenerationPreview } from "../../../types/geminiGenerationPreview";
import { generationCostView } from "../../../utils/generationCost";

/** Coût estimé en crédits, affiché juste avant la confirmation de la génération. */
export default function GeminiCostEstimate({ preview }: { preview: GeminiGenerationPreview }) {
  const { wallet } = useRoleCredits("teacher");
  const view = generationCostView(preview, wallet);
  const tone = view.insufficient ? statusTones.warning : statusTones.violet;
  return (
    <Box dir="rtl" sx={{ mb: 2, p: 2, borderRadius: 3, bgcolor: tone.bg, color: tone.fg }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <PaidIcon sx={{ fontSize: 22 }} />
        <Typography variant="subtitle2" fontWeight={800}>
          {view.title}: {view.cost}
        </Typography>
        {view.balance && (
          <Typography variant="caption" sx={{ marginInlineStart: "auto", fontWeight: 700 }}>
            {view.balance}
          </Typography>
        )}
      </Box>
      {view.includes && <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>{view.includes}</Typography>}
      {view.worstCase && <Typography variant="caption" display="block">{view.worstCase}</Typography>}
      {view.insufficient && (
        <Typography variant="caption" display="block" fontWeight={700} sx={{ mt: 0.5 }}>
          {he.geminiCostInsufficient}
        </Typography>
      )}
    </Box>
  );
}
