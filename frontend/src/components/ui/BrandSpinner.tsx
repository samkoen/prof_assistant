import { alpha, Box } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { brand, brandTextGradient } from "../../theme/brand";
import { he } from "../../i18n/he";
import { brandSpinnerMetrics, type BrandSpinnerMetrics } from "../../utils/brandSpinner";

type BrandSpinnerProps = {
  size?: number;
};

const spinKeyframes = {
  "@keyframes brandSpin": {
    to: { transform: "rotate(360deg)" },
  },
  "@keyframes brandPulse": {
    "0%, 100%": { transform: "scale(1)" },
    "50%": { transform: "scale(0.92)" },
  },
} as const;

function SpinnerTrack() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        border: `1px solid ${alpha(brand.violet400, 0.45)}`,
        background: alpha(brand.violet50, 0.85),
        boxShadow: `0 10px 24px ${alpha(brand.violet600, 0.16)}`,
      }}
    />
  );
}

function SpinnerArc({ trackWidth }: { trackWidth: number }) {
  const inner = `calc(100% - ${trackWidth}px)`;
  const cut = `radial-gradient(farthest-side, transparent ${inner}, #000 ${inner})`;
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: `conic-gradient(from 210deg, ${brand.violet700} 0%, ${brand.sky500} 32%, ${brand.amber500} 48%, transparent 70%)`,
        WebkitMask: cut,
        mask: cut,
        animation: "brandSpin 0.95s linear infinite",
      }}
    />
  );
}

function SpinnerJewel({ metrics }: { metrics: BrandSpinnerMetrics }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: metrics.jewel,
          height: metrics.jewel,
          borderRadius: "50%",
          background: brandTextGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 6px 16px ${alpha(brand.violet600, 0.28)}`,
          animation: "brandPulse 1.7s ease-in-out infinite",
        }}
      >
        <AutoAwesomeIcon sx={{ fontSize: metrics.iconSize, color: brand.white }} />
      </Box>
    </Box>
  );
}

export default function BrandSpinner({ size = 52 }: BrandSpinnerProps) {
  const metrics = brandSpinnerMetrics(size);
  return (
    <Box
      role="progressbar"
      aria-label={he.loading}
      sx={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
        ...spinKeyframes,
      }}
    >
      <SpinnerTrack />
      <SpinnerArc trackWidth={metrics.trackWidth} />
      <SpinnerJewel metrics={metrics} />
    </Box>
  );
}
