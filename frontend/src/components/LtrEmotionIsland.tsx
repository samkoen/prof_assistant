import type { ReactNode } from "react";
import { CacheProvider } from "@emotion/react";
import { Box, ThemeProvider, type SxProps, type Theme } from "@mui/material";
import { cacheLtr } from "../emotion/caches";
import { ltrTheme } from "../theme";

type LtrEmotionIslandProps = {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

/**
 * Îlot LTR dans l’app RTL : styles Emotion sans inversion left/right.
 * À utiliser pour שאלות קיימות (examens en français).
 */
export function LtrEmotionIsland({ children, sx }: LtrEmotionIslandProps) {
  return (
    <CacheProvider value={cacheLtr}>
      <ThemeProvider theme={ltrTheme}>
        <Box dir="ltr" sx={{ width: "100%", textAlign: "left", direction: "ltr", ...sx }}>
          {children}
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}
