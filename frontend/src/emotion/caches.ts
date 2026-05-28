import createCache from "@emotion/cache";
import { prefixer } from "stylis";

/**
 * Cache Emotion global — sans stylis-plugin-rtl.
 * Le RTL est géré par `theme.direction: "rtl"` (MUI + CssBaseline).
 * Évite la double inversion CSS (stylis + thème) qui provoquait des alignements incohérents.
 */
export const emotionCache = createCache({
  key: "mui",
  stylisPlugins: [prefixer],
});

/** Alias conservés pour compatibilité (main, îlots LTR). */
export const cacheRtl = emotionCache;
export const cacheLtr = emotionCache;
