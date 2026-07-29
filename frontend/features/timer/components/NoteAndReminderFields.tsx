"use client";

import type { Reminder } from "@/lib/ui/remindersApi";

type Props = {
  note: string;
  onNoteChange: (v: string) => void;
  reminders: Reminder[];
  linkedReminderId: string | null;
  onLinkedReminderChange: (id: string | null) => void;
  disabled?: boolean;
};

// タイマー開始〜記録の間、常時入力可能なメモ・Todo紐付け欄。
// 実際にサーバへ送信されるのは記録（Record / 手動記録）操作のタイミングのみ。
export default function NoteAndReminderFields({
  note,
  onNoteChange,
  reminders,
  linkedReminderId,
  onLinkedReminderChange,
  disabled = false,
}: Props) {
  return (
    <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
      <textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        disabled={disabled}
        placeholder="メモ（任意）"
        rows={2}
        style={textareaStyle}
      />
      <select
        value={linkedReminderId ?? ""}
        onChange={(e) => onLinkedReminderChange(e.target.value || null)}
        disabled={disabled}
        style={selectStyle}
      >
        <option value="">Todoと紐付ける（任意）</option>
        {reminders.map((r) => (
          <option key={r.id} value={r.id}>
            {r.title}
          </option>
        ))}
      </select>
    </div>
  );
}

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(186,230,253,0.15)",
  background: "rgba(15,23,42,0.5)",
  color: "#eaf0ff",
  fontSize: 13,
  resize: "vertical",
  fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(186,230,253,0.15)",
  background: "rgba(15,23,42,0.5)",
  color: "#eaf0ff",
  fontSize: 13,
};
