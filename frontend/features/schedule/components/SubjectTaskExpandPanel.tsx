"use client";

import UiCheckbox from "@/components/ui/UiCheckbox";
import { useSubjectTaskReminders } from "../hooks/useSubjectTaskReminders";

type Props = {
  subjectTaskId: string;
  onProgressChanged: () => void;
};

// チェックボックス+タイトルのみ（期限日はリマインダータブでのみ表示する既存方針を踏襲）
export default function SubjectTaskExpandPanel({ subjectTaskId, onProgressChanged }: Props) {
  const { items, loading, err, toggle } = useSubjectTaskReminders(subjectTaskId, true, onProgressChanged);

  return (
    <div style={panelStyle}>
      {loading && <div style={{ opacity: 0.7, fontSize: 12 }}>読み込み中...</div>}
      {err && <div style={{ color: "#fca5a5", fontSize: 12 }}>{err}</div>}
      {!loading && !err && items.length === 0 && (
        <div style={{ opacity: 0.7, fontSize: 12 }}>リマインダーがありません</div>
      )}
      {items.map((item) => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UiCheckbox checked={item.isDone} onToggle={() => toggle(item)} ariaLabel={`toggle ${item.title}`} />
          <span
            style={{
              fontSize: 13,
              opacity: item.isDone ? 0.6 : 1,
              textDecoration: item.isDone ? "line-through" : "none",
            }}
          >
            {item.title}
          </span>
        </div>
      ))}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  marginLeft: 100,
  marginTop: 4,
  padding: 10,
  border: "1px solid var(--line)",
  borderRadius: 10,
  display: "grid",
  gap: 6,
};
