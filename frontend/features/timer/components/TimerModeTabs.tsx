"use client";

import { motion } from "framer-motion";

export type TimerUiMode = "POMODORO" | "STOPWATCH" | "MANUAL";

const TABS: { value: TimerUiMode; label: string }[] = [
  { value: "POMODORO", label: "ポモドーロ" },
  { value: "STOPWATCH", label: "ストップウォッチ" },
  { value: "MANUAL", label: "手動入力" },
];

type Props = {
  mode: TimerUiMode;
  disabled?: boolean;
  onChange: (mode: TimerUiMode) => void;
};

// CPA-Dashboardの TimerModeTabs.tsx を簡略移植。
// スライドする背景ピルは framer-motion の layoutId 共有アニメーションで実現する
// （DOM計測は不要。(tabs)/layout.tsx の下線スライドとは別方式だが、用途が違うため統一しない）。
export default function TimerModeTabs({ mode, disabled = false, onChange }: Props) {
  return (
    <div style={containerStyle}>
      {TABS.map((tab) => {
        const active = tab.value === mode;
        return (
          <button
            key={tab.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(tab.value)}
            style={{
              ...tabButtonStyle,
              color: active ? "#eaf0ff" : "rgba(234,240,255,0.6)",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {active && (
              <motion.div
                layoutId="timer-mode-pill"
                style={pillStyle}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
  gap: 4,
  padding: 4,
  borderRadius: 999,
  background: "rgba(15,23,42,0.5)",
  border: "1px solid rgba(186,230,253,0.15)",
  marginBottom: 24,
};

const tabButtonStyle: React.CSSProperties = {
  position: "relative",
  padding: "8px 18px",
  borderRadius: 999,
  border: "none",
  background: "transparent",
  fontSize: 13,
  fontWeight: 600,
};

const pillStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: 999,
  background: "rgba(255,255,255,0.1)",
};
