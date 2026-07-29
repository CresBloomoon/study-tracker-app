"use client";

type Props = {
  value: number;
  label: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
};

// 手動入力モードの時・分スピンボタン。ホイールスクロールで増減できる。
export default function TimeUnitBox({ value, label, min, max, onChange }: Props) {
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1;
    onChange(Math.min(max, Math.max(min, value + dir)));
  }

  return (
    <div onWheel={handleWheel} style={timeUnitBoxStyle}>
      <div style={{ fontSize: 28, fontWeight: 600, color: "#eaf0ff", fontVariantNumeric: "tabular-nums" }}>
        {String(value).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 11, color: "rgba(234,240,255,0.6)" }}>{label}</div>
    </div>
  );
}

const timeUnitBoxStyle: React.CSSProperties = {
  width: 72,
  height: 96,
  borderRadius: 12,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "ns-resize",
  border: "1px solid transparent",
};
