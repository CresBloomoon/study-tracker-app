"use client";

import type { TrendItem } from "../hooks/useStudyTrend";

function fmtMinutes(m: number) {
  const mm = Math.max(0, Math.floor(m));
  const h = Math.floor(mm / 60);
  const min = mm % 60;
  if (h <= 0) return `${min}分`;
  if (min === 0) return `${h}時間`;
  return `${h}時間${min}分`;
}

type Props = {
  title: string;
  items: TrendItem[];
  loading: boolean;
  err: string | null;
};

const BAR_AREA_HEIGHT_PX = 100;

// 月次・年次推移で共用する縦棒グラフ。単一系列（合計時間）のため色は常に--accent固定で、
// カテゴリカルパレットの割当は不要
export default function TrendBarChart({ title, items, loading, err }: Props) {
  const maxMinutes = Math.max(...items.map((i) => i.minutes), 1);

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{title}</div>

      {loading && <div style={{ opacity: 0.7 }}>読み込み中...</div>}
      {err && <div style={{ color: "#fca5a5" }}>{err}</div>}
      {!loading && !err && items.length === 0 && <div style={{ opacity: 0.7 }}>まだデータがありません</div>}

      {!loading && !err && items.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 8, minWidth: items.length * 36 }}>
            {items.map((item) => {
              const ratio = item.minutes / maxMinutes;
              const barHeightPct = item.minutes > 0 ? Math.max(ratio * 100, 4) : 0;
              return (
                <div key={item.label} style={barColumnStyle}>
                  <div style={{ width: "100%", height: BAR_AREA_HEIGHT_PX, display: "flex", alignItems: "flex-end" }}>
                    <div
                      title={fmtMinutes(item.minutes)}
                      style={{ ...barStyle, height: `${barHeightPct}%` }}
                    />
                  </div>
                  <div style={labelStyle}>{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.02)",
};

const barColumnStyle: React.CSSProperties = {
  flex: "0 0 auto",
  width: 28,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
};

const barStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--accent)",
  borderRadius: "4px 4px 0 0",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  opacity: 0.7,
  whiteSpace: "nowrap",
};
