import { alpha, Box, Typography } from "@mui/material";
import BrandSpinner from "./ui/BrandSpinner";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { brand, brandTextGradient, softCardShadow } from "../theme/brand";
import { he } from "../i18n/he";

const bannerCardSx = {
  mb: 2,
  overflow: "hidden",
  borderRadius: 3,
  border: `1px solid ${alpha(brand.violet600, 0.12)}`,
  boxShadow: softCardShadow,
  background: `linear-gradient(135deg, ${alpha(brand.violet50, 0.95)} 0%, ${brand.white} 72%)`,
} as const;

function WaitingDots() {
  return (
    <Box sx={{ display: "flex", gap: 0.7, mt: 0.85 }} aria-hidden>
      {[brand.violet600, brand.sky500, brand.amber500].map((color, i) => (
        <Box
          key={color}
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: color,
            animation: "brandDot 1.15s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
            "@keyframes brandDot": {
              "0%, 80%, 100%": { opacity: 0.28, transform: "translateY(0)" },
              "40%": { opacity: 1, transform: "translateY(-3px)" },
            },
          }}
        />
      ))}
    </Box>
  );
}

export default function GeminiAiWorkingBanner({ message }: { message?: string }) {
  return (
    <Box dir="rtl" role="status" sx={bannerCardSx}>
      <Box sx={{ height: 4, background: brandTextGradient }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2.25, py: 1.85 }}>
        <BrandSpinner size={52} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={hebrewAlignRightSx}>
            {message ?? he.geminiAiWorking}
          </Typography>
          <WaitingDots />
        </Box>
      </Box>
    </Box>
  );
}
