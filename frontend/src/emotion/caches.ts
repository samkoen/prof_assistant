import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

/** Cache global RTL (stylis inverse left/right dans tout le sx MUI). */
export const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

/** Cache LTR — pas de plugin RTL : left reste left pour les îlots français. */
export const cacheLtr = createCache({
  key: "muiltr",
  stylisPlugins: [prefixer],
});
