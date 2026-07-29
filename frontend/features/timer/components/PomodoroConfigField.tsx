"use client";

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
};

export default function PomodoroConfigField({ label, value, onChange, min, max }: Props) {
  return (
    <label style={fieldStyle}>
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        style={inputStyle}
      />
    </label>
  );
}

// この行の並びを制御する側（StudyTimer.tsx）が使う、3フィールドの横並びコンテナ用スタイル。
// コンポーネント本体には使われないが、関連スタイルとしてここに同居させている。
export const pomodoroConfigStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  justifyContent: "center",
  marginBottom: 20,
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: 11,
  color: "rgba(234,240,255,0.7)",
};

const inputStyle: React.CSSProperties = {
  width: 64,
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid rgba(186,230,253,0.15)",
  background: "rgba(15,23,42,0.5)",
  color: "#eaf0ff",
  fontSize: 13,
};
