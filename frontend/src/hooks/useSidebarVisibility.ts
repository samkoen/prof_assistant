import { useCallback, useState } from "react";
import { readSidebarVisible, writeSidebarVisible } from "../utils/sidebarVisibility";

export function useSidebarVisibility() {
  const [visible, setVisible] = useState(readSidebarVisible);

  const show = useCallback(() => {
    writeSidebarVisible(true);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    writeSidebarVisible(false);
    setVisible(false);
  }, []);

  return { visible, show, hide };
}
