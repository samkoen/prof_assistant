import type { ReactNode } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useDemoPlayback } from "../../hooks/useDemoPlayback";
import { he } from "../../i18n/he";
import { brand, elevatedCardShadow } from "../../theme/brand";
import { PUBLIC_OFFER_IDS } from "../../utils/publicSite";
import DemoSlide from "./DemoSlide";

export default function ProductDemo() {
  const demo = useDemoPlayback(PUBLIC_OFFER_IDS.length);
  const id = PUBLIC_OFFER_IDS[demo.index];

  return (
    <Box component="section" aria-label={he.publicHome.demoTitle}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>{he.publicHome.demoTitle}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{he.publicHome.demoHint}</Typography>
      <DemoPlayer index={demo.index} playing={demo.playing} onToggle={demo.toggle} onPick={demo.pick}>
        <DemoSlide id={id} />
      </DemoPlayer>
    </Box>
  );
}

function DemoPlayer({
  index,
  playing,
  onToggle,
  onPick,
  children,
}: {
  index: number;
  playing: boolean;
  onToggle: () => void;
  onPick: (index: number) => void;
  children: ReactNode;
}) {
  return (
    <Box sx={{ borderRadius: 4, overflow: "hidden", boxShadow: elevatedCardShadow, bgcolor: brand.white }}>
      <Box sx={{ minHeight: { xs: 280, sm: 320 }, p: { xs: 2.5, sm: 4 }, bgcolor: brand.slate900, color: brand.white }}>
        {children}
      </Box>
      <DemoControls index={index} playing={playing} onToggle={onToggle} onPick={onPick} />
    </Box>
  );
}

function DemoControls({
  index,
  playing,
  onToggle,
  onPick,
}: {
  index: number;
  playing: boolean;
  onToggle: () => void;
  onPick: (index: number) => void;
}) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, px: 2, py: 1.25 }}>
      <IconButton aria-label={playing ? he.publicHome.pause : he.publicHome.play} onClick={onToggle}>
        {playing ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
      {PUBLIC_OFFER_IDS.map((id, scene) => (
        <SceneDot key={id} label={he.publicHome.offers[id].title} active={scene === index} onPick={() => onPick(scene)} />
      ))}
    </Stack>
  );
}

function SceneDot({ label, active, onPick }: { label: string; active: boolean; onPick: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      aria-label={label}
      aria-current={active || undefined}
      onClick={onPick}
      sx={{
        width: active ? 28 : 10,
        height: 10,
        border: 0,
        borderRadius: 99,
        cursor: "pointer",
        bgcolor: active ? brand.violet600 : brand.slate200,
      }}
    />
  );
}
