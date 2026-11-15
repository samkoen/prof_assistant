import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { hebrewAlignRightSx } from "../../styles/hebrewAlign";
import { surface } from "../../theme/brand";
import { MOBILE_NAV_HEIGHT } from "./MobileBottomNav";

type ShellMainProps = {
  topBar: ReactNode;
  children: ReactNode;
};

const scrollAreaSx = {
  flex: "1 1 0",
  minWidth: 0,
  width: 0,
  order: 1,
  height: "100dvh",
  overflowY: "auto",
  overflowX: "hidden",
  bgcolor: { xs: surface.card, sm: surface.page },
} as const;

const contentSx = {
  ...hebrewAlignRightSx,
  minWidth: 0,
  maxWidth: 1320,
  mx: "auto",
  px: { xs: 2, sm: 3, md: 4 },
  pt: { xs: 2, sm: 3 },
  pb: { xs: `calc(${MOBILE_NAV_HEIGHT + 24}px + env(safe-area-inset-bottom))`, sm: 5 },
} as const;

/** Zone principale : barre supérieure collante, puis le contenu de la page sur fond neutre. */
export default function ShellMain({ topBar, children }: ShellMainProps) {
  return (
    <Box component="main" sx={scrollAreaSx}>
      {topBar}
      <Box sx={contentSx}>{children}</Box>
    </Box>
  );
}
