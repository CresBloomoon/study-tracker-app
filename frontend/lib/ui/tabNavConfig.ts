export const TAB_NAV = {
  items: [
    { href: "/dashboard", label: "学習時間" },
    { href: "/timer", label: "タイマー" },
    { href: "/reminders", label: "リマインダ" },
    { href: "/calendar", label: "カレンダー" },
    { href: "/projects", label: "プロジェクト" },
  ] as const,

  // layout (numbers)
  gapPx: 24,
  padYPx: 10,
  underlineHeightPx: 2,

  // motion
  durationMs: 180,
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",

  // colors (theme via CSS variables)
  colorActive: "var(--fg)",
  colorInactive: "var(--muted)",
  underlineColor: "var(--accent)",
  railBg: "rgba(255,255,255,0.03)",
  railBorder: "var(--line)",
  focusRingColor: "var(--focus)",
  focusRingWidthPx: 2,
} as const;
