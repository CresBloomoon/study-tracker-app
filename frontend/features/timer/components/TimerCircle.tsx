"use client";

import TimeUnitBox from "./TimeUnitBox";
import type { TimerUiMode } from "./TimerModeTabs";

type Props = {
  uiMode: TimerUiMode;
  clickable: boolean;
  onClick: () => void;
  pomodoroRatio: number | null;
  ringColor: string;
  centerLabel: string;
  manualHours: number;
  manualMinutes: number;
  onManualHoursChange: (v: number) => void;
  onManualMinutesChange: (v: number) => void;
  dimmed: boolean;
};

// 円形タイマー本体（クリックで開始/一時停止、中央に時刻表示、ポモドーロ時は進捗リング）
export default function TimerCircle({
  uiMode,
  clickable,
  onClick,
  pomodoroRatio,
  ringColor,
  centerLabel,
  manualHours,
  manualMinutes,
  onManualHoursChange,
  onManualMinutesChange,
  dimmed,
}: Props) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : -1}
        onClick={onClick}
        style={{ ...circleStyle, cursor: clickable ? "pointer" : "default", opacity: dimmed ? 0.5 : 1 }}
      >
        {uiMode === "POMODORO" && pomodoroRatio != null && (
          <svg viewBox="0 0 100 100" style={ringSvgStyle}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(186,230,253,0.18)" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={ringColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - pomodoroRatio)}`}
            />
          </svg>
        )}

        {uiMode === "MANUAL" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }} onClick={(e) => e.stopPropagation()}>
            <TimeUnitBox value={manualHours} label="時" min={0} max={23} onChange={onManualHoursChange} />
            <span style={{ fontSize: 32, color: "#eaf0ff" }}>:</span>
            <TimeUnitBox value={manualMinutes} label="分" min={0} max={59} onChange={onManualMinutesChange} />
          </div>
        ) : (
          <div style={{ fontSize: 40, fontWeight: 600, color: "#eaf0ff", zIndex: 1, fontVariantNumeric: "tabular-nums" }}>
            {centerLabel}
          </div>
        )}
      </div>
    </div>
  );
}

const circleStyle: React.CSSProperties = {
  position: "relative",
  width: 280,
  height: 280,
  borderRadius: "50%",
  background: "rgba(15,23,42,0.35)",
  border: "1px solid rgba(186,230,253,0.22)",
  boxShadow: "0 18px 70px rgba(0,0,0,0.42)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const ringSvgStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  transform: "rotate(-90deg)",
};
