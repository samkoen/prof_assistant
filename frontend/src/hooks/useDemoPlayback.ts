import { useEffect, useState } from "react";
import { nextDemoIndex } from "../utils/publicSite";

const DEMO_MS = 4500;

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useDemoPlayback(total: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !reducedMotion());

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => nextDemoIndex(current, total));
    }, DEMO_MS);
    return () => window.clearInterval(timer);
  }, [playing, total]);

  return {
    index,
    playing,
    toggle: () => setPlaying((value) => !value),
    pick: setIndex,
  };
}
