const STORAGE_KEY = "exam.sidebarVisible";

export function readSidebarVisible(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) !== "false";
}

export function writeSidebarVisible(visible: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(visible));
}
