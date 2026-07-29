"use client";

import { useSubjectBreakdown } from "../hooks/useSubjectBreakdown";

function fmtMinutes(m: number) {
  const mm = Math.max(0, Math.floor(m));
  const h = Math.floor(mm / 60);
  const min = mm % 60;
  if (h <= 0) return `${min}分`;
  if (min === 0) return `${h}時間`;
  return `${h}時間${min}分`;
}

// CPA-Dashboardの SubjectChart の見た目（科目名+色付き棒+累計時間）を移植。
// 色は科目ごとのcolorHex（ユーザーデータ）をそのまま使うため、カテゴリカルパレットの新規割当は行わない。
export default function SubjectBreakdownChart() {
  const { items, loading, err } = useSubjectBreakdown();
  const maxMinutes = Math.max(...items.map((i) => i.minutes), 1);

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>科目別累計学習時間</div>

      {loading && <div style={{ opacity: 0.7 }}>読み込み中...</div>}
      {err && <div style={{ color: "#fca5a5" }}>{err}</div>}

      {!loading && !err && items.length === 0 && <div style={{ opacity: 0.7 }}>まだデータがありません</div>}

      {!loading && !err && items.length > 0 && (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((item) => {
            const ratio = item.minutes / maxMinutes;
            return (
              <div key={item.subjectId ?? "unassigned"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ ...dotStyle, background: item.colorHex }} />
                    <span style={{ fontWeight: 600 }}>{item.subjectName}</span>
                  </div>
                  <span style={{ opacity: 0.85, fontVariantNumeric: "tabular-nums" }}>{fmtMinutes(item.minutes)}</span>
                </div>
                <div style={trackStyle}>
                  <div
                    title={fmtMinutes(item.minutes)}
                    style={{ ...fillStyle, width: `${Math.round(ratio * 100)}%`, background: item.colorHex }}
                  />
                </div>
              </div>
            );
          })}
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

const dotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  flexShrink: 0,
};

const trackStyle: React.CSSProperties = {
  height: 12,
  borderRadius: 999,
  background: "rgba(255,255,255,0.06)",
  overflow: "hidden",
};

const fillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  transition: "width 200ms ease-out",
};
