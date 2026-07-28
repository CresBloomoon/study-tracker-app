// frontend/app/(tabs)/dashboard/_components/StudySummary.tsx
import { UI } from "@/lib/ui/uiTokens";

type Props = {
  todayHours: number;
  weekHours: number;
};

export default function StudySummary({ todayHours, weekHours }: Props) {
  return (
    <section style={{ display: "grid", gap: UI.sectionGap }}>
      <h1 style={{ margin: 0, fontSize: UI.h1, color: UI.text }}>ダッシュボード</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: UI.sectionGap,
        }}
      >
        <Card title="今日" value={`${todayHours.toFixed(1)} 時間`} />
        <Card title="今週" value={`${weekHours.toFixed(1)} 時間`} />
      </div>
    </section>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        background: UI.cardBg,
        border: `1px solid ${UI.border}`,
        borderRadius: UI.radius,
        padding: UI.cardPad,
        boxShadow: UI.shadow,
      }}
    >
      <div style={{ color: UI.subText, fontSize: 13 }}>{title}</div>
      <div style={{ color: UI.text, fontSize: 28, fontWeight: 700, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}
