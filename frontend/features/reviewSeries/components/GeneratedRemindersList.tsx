"use client";

import type { CreatedReviewSeries } from "@/lib/ui/reviewSeriesApi";

type Props = {
  series: CreatedReviewSeries;
};

export default function GeneratedRemindersList({ series }: Props) {
  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>「{series.title}」を作成しました</div>
      <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 8 }}>
        以下のリマインダーが自動生成されました（{series.reminders.length}件）
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {series.reminders.map((r) => (
          <div key={r.id} style={rowStyle}>
            <span>{r.title}</span>
            <span style={{ opacity: 0.7, fontSize: 12 }}>{new Date(r.dueAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.02)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 10px",
  border: "1px solid var(--line)",
  borderRadius: 10,
};
