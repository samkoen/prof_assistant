import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { OPEN_CREATE_PARAM } from "../config/createActions";

/** Ouvre le dialogue de création quand l'URL contient ?new=1 (bouton « יצירה »), puis nettoie l'URL. */
export function useOpenCreateFromUrl(open: () => void, ready = true): void {
  const [params, setParams] = useSearchParams();
  const requested = params.get(OPEN_CREATE_PARAM) === "1";
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    if (!requested || !ready) return;
    const next = new URLSearchParams(params);
    next.delete(OPEN_CREATE_PARAM);
    setParams(next, { replace: true });
    openRef.current();
  }, [requested, ready, params, setParams]);
}
