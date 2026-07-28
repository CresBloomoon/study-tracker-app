"use client";

import { DashboardSummary } from "@/features/dashboard/types/dashboard";

function fmtMinutes(m: number) {
  const mm = Math.max(0, Math.floor(m));
  const h = Math.floor(mm / 60);
  const min = mm % 60;
  if (h <= 0) return `${min}m`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}m`;
}

export default function BySubjectBreakdown({ summary }: { summary: DashboardSummary }) {
  const items = summary.bySubject ?? [];
  const total = items.reduce((acc, x) => acc + (x.minutes ?? 0), 0);

  if (!items.length) return <div style={{ opacity: 0.75 }}>まだデータなし</div>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontWeight: 700 }}>科目別（週）</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>合計 {fmtMinutes(total)}</div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {items.map((it) => {
          const ratio = total > 0 ? it.minutes / total : 0;
          return (
            <div key={`${it.subjectId ?? "null"}`} style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 10, alignItems: "center" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: it.colorHex }} />
                  <span style={{ fontWeight: 600 }}>{it.subjectName}</span>
                  <span style={{ opacity: 0.7, fontSize: 12 }}>{Math.round(ratio * 100)}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round(ratio * 100)}%`, height: "100%", background: it.colorHex }} />
                </div>
              </div>

              <div style={{ textAlign: "right", opacity: 0.9 }}>{fmtMinutes(it.minutes)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
