// frontend/lib/ui/theme.ts
export type Theme = "dark" | "light" | "darker";

const KEY = "cpa.theme";
const DEFAULT_THEME: Theme = "dark";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const v = window.localStorage.getItem(KEY);
  if (v === "dark" || v === "light" || v === "darker") return v;
  return DEFAULT_THEME;
}

export function setStoredTheme(theme: Theme) {
  window.localStorage.setItem(KEY, theme);
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
