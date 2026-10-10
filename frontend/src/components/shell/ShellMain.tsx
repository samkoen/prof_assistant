import type { ReactNode } from "react";
import { alpha, Box } from "@mui/material";
import { hebrewAlignRightSx } from "../../styles/hebrewAlign";
import { brand, softCardShadow } from "../../theme/brand";

type ShellMainProps = {
  topBar: ReactNode;
  children: ReactNode;
};

const scrollAreaSx = {
  flex: "1 1 0",
  minWidth: 0,
  width: 0,
  order: 1,
  height: "100vh",
  overflowY: "auto",
  overflowX: "hidden",
} as const;

const surfaceSx = {
  ...hebrewAlignRightSx,
  minWidth: 0,
  maxWidth: "100%",
  bgcolor: brand.white,
  borderRadius: { xs: 3, sm: 4 },
  p: { xs: 2, sm: 3, md: 4 },
  border: `1px solid ${alpha(brand.violet600, 0.1)}`,
  boxShadow: softCardShadow,
  minHeight: { xs: "auto", sm: "calc(100vh - 60px - 48px)" },
} as const;

/** Zone principale : barre supérieure collante + surface blanche centrée. */
export default function ShellMain({ topBar, children }: ShellMainProps) {
  return (
    <Box component="main" sx={scrollAreaSx}>
      {topBar}
      <Box sx={{ maxWidth: 1480, mx: "auto", px: { xs: 1.5, sm: 2.5, md: 3.5 }, py: { xs: 2, sm: 3 } }}>
        <Box sx={surfaceSx}>{children}</Box>
      </Box>
    </Box>
  );
}
