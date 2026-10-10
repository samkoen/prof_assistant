import { alpha, Box } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { brand, brandTextGradient } from "../../theme/brand";
import { he } from "../../i18n/he";
import { brandSpinnerMetrics, type BrandSpinnerMetrics } from "../../utils/brandSpinner";

type BrandSpinnerProps = {
  size?: number;
};

const keyframes = {
  "@keyframes orbitCw": { to: { transform: "rotate(360deg)" } },
  "@keyframes orbitCcw": { to: { transform: "rotate(-360deg)" } },
  "@keyframes orbitCore": {
    "0%, 100%": { transform: "scale(1)" },
    "50%": { transform: "scale(0.82)" },
  },
  "@keyframes orbitHalo": {
    "0%, 100%": { opacity: 0.35, transform: "scale(0.92)" },
    "50%": { opacity: 0.9, transform: "scale(1.08)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    "& [data-orbit]": { animationDuration: "6s !important" },
  },
} as const;

/** Anneau en arc dégradé qui tourne ; le masque radial évacue le centre. */
function Arc({ gradient, width, inset, duration, reverse }: { gradient: string; width: number; inset: number; duration: string; reverse?: boolean }) {
  const inner = `calc(100% - ${width}px)`;
  const cut = `radial-gradient(farthest-side, transparent ${inner}, #000 ${inner})`;
  return (
    <Box
      aria-hidden
      data-orbit
      sx={{
        position: "absolute",
        inset,
        borderRadius: "50%",
        background: gradient,
        WebkitMask: cut,
        mask: cut,
        animation: `${reverse ? "orbitCcw" : "orbitCw"} ${duration} linear infinite`,
      }}
    />
  );
}

function Halo() {
  return (
    <Box
      aria-hidden
      data-orbit
      sx={{
        position: "absolute",
        inset: "-12%",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${alpha(brand.violet500, 0.35)} 0%, transparent 68%)`,
        animation: "orbitHalo 2.2s ease-in-out infinite",
      }}
    />
  );
}

function Core({ metrics }: { metrics: BrandSpinnerMetrics }) {
  const core = Math.round(metrics.jewel * 0.78);
  return (
    <Box aria-hidden sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box
        data-orbit
        sx={{
          width: core,
          height: core,
          borderRadius: "50%",
          background: brandTextGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 14px ${alpha(brand.violet600, 0.35)}`,
          animation: "orbitCore 1.6s ease-in-out infinite",
        }}
      >
        {metrics.showIcon && <AutoAwesomeIcon sx={{ fontSize: Math.round(core * 0.55), color: brand.white }} />}
      </Box>
    </Box>
  );
}

const OUTER = `conic-gradient(from 200deg, transparent 0%, ${brand.violet700} 18%, ${brand.sky500} 52%, transparent 78%)`;
const INNER = `conic-gradient(from 20deg, transparent 0%, ${brand.amber500} 25%, ${brand.mint500} 58%, transparent 80%)`;

/** Spinner « orbite » : deux anneaux contrarotatifs autour d'un cœur qui pulse. */
export default function BrandSpinner({ size = 52 }: BrandSpinnerProps) {
  const m = brandSpinnerMetrics(size);
  return (
    <Box role="progressbar" aria-label={he.loading} sx={{ width: size, height: size, position: "relative", flexShrink: 0, ...keyframes }}>
      <Halo />
      <Arc gradient={OUTER} width={m.trackWidth} inset={0} duration="1.15s" />
      <Arc gradient={INNER} width={m.innerTrackWidth} inset={m.innerInset} duration="1.6s" reverse />
      <Core metrics={m} />
    </Box>
  );
}
