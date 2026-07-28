// frontend/components/ThemeToggle.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { Theme } from "../lib/ui/theme";
import { applyTheme, getStoredTheme, setStoredTheme } from "../lib/ui/theme";

const ORDER: Theme[] = ["dark", "darker", "light"];
const nextTheme = (t: Theme) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const t = getStoredTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  const label = theme === "dark" ? "Dark" : theme === "darker" ? "Darker" : "Light";

  const onClick = () => {
    const t = nextTheme(theme);
    setTheme(t);
    applyTheme(t);
    setStoredTheme(t);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`theme: ${label}`}
      style={{
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid var(--line)",
        background: "rgba(255,255,255,0.03)",
        color: "var(--fg)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
