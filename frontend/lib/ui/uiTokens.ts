// frontend/lib/ui/uiTokens.ts
export const UI = {
  // colors (theme via CSS variables)
  bg: "var(--bg)",
  text: "var(--fg)",
  subText: "var(--muted)",
  border: "var(--line)",
  cardBg: "var(--card-bg)",
  cardBg2: "var(--card-bg-2)",
  active: "var(--accent)",
  focus: "var(--focus)",
  shadow: "var(--shadow)",

  // layout
  pagePadX: 28,
  pagePadTop: 26,
  sectionGap: 18,

  // card
  radius: 16,
  cardPad: 18,

  // typography
  h1: 36,
  h2: 18,
  mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,

  // tabs (★ここが調整ポイント)
  tabs: {
    gapPx: 24,
    padYPx: 10,
    underlineHeightPx: 2,
    durationMs: 180,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",

    // colors are still CSS vars
    colorActive: "var(--fg)",
    colorInactive: "var(--muted)",
    colorHover: "var(--fg)",
    underlineColor: "var(--accent)",

    // small “lift” so tabs don’t melt into bg
    railBg: "rgba(255,255,255,0.03)",
    railBorder: "var(--line)",
    focusRingWidthPx: 2,
  },
} as const;
