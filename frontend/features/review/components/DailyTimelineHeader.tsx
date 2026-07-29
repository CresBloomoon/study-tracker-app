"use client";

function fmtMinutes(m: number) {
  const mm = Math.max(0, Math.floor(m));
  const h = Math.floor(mm / 60);
  const min = mm % 60;
  if (h <= 0) return `${min}分`;
  if (min === 0) return `${h}時間`;
  return `${h}時間${min}分`;
}

type Props = {
  dateKey: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  totalMinutes: number;
};

export default function DailyTimelineHeader({ dateKey, onPrevDay, onNextDay, totalMinutes }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onPrevDay} style={navBtnStyle} aria-label="前日">
          ‹
        </button>
        <div style={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{dateKey}</div>
        <button onClick={onNextDay} style={navBtnStyle} aria-label="翌日">
          ›
        </button>
      </div>
      <div style={{ opacity: 0.8, fontSize: 13 }}>合計 {fmtMinutes(totalMinutes)}</div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fg)",
  cursor: "pointer",
  fontSize: 16,
};
