"use client";

import { useEffect } from "react";

export type ThemeName = "dark" | "darker" | "light";

const STORAGE_KEY = "cpa-theme";

function getPreferredTheme(): ThemeName {
  // 初期値：OSの設定に寄せる（好みで dark 固定でもOK）
  if (typeof window === "undefined") return "dark";
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeBoot() {
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeName | null);
    const theme = saved ?? getPreferredTheme();
    document.documentElement.dataset.theme = theme;
  }, []);

  return null;
}

/** 後でボタン作る時に使う用（今は使わなくてOK） */
export function setTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}
