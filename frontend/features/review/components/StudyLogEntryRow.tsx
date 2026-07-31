"use client";

import type { StudyLogItem, SubjectMeta } from "@/lib/ui/reviewApi";
import type { Reminder } from "@/lib/ui/remindersApi";
import UiCheckbox from "@/components/ui/UiCheckbox";

function fmtTimeRange(startedAt: string, endedAt: string) {
  const s = new Date(startedAt);
  const e = new Date(endedAt);
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${fmt(s)} - ${fmt(e)}`;
}

function fmtDurationMinutes(sec: number) {
  return `${Math.ceil(sec / 60)}分`;
}

type Props = {
  item: StudyLogItem;
  subject?: SubjectMeta;
  linkedReminder?: Reminder;
  onToggleReminder?: (reminder: Reminder) => void | Promise<void>;
};

export default function StudyLogEntryRow({ item, subject, linkedReminder, onToggleReminder }: Props) {
  return (
    <div style={rowStyle}>
      <span style={{ ...dotStyle, background: subject?.colorHex ?? "#6b7280" }} />
      <div style={{ flex: 1, display: "grid", gap: 2 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          <span style={{ fontWeight: 600 }}>{subject?.name ?? "未分類"}</span>
          <span style={{ opacity: 0.7, fontSize: 12 }}>{fmtTimeRange(item.startedAt, item.endedAt)}</span>
        </div>
        {item.note && <div style={{ opacity: 0.75, fontSize: 12 }}>{item.note}</div>}
        {linkedReminder && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <UiCheckbox
              checked={linkedReminder.isDone}
              onToggle={() => onToggleReminder?.(linkedReminder)}
              ariaLabel={`toggle ${linkedReminder.title}`}
            />
            <span style={{ opacity: 0.75, fontSize: 12 }}>{linkedReminder.title}</span>
          </div>
        )}
      </div>
      <div style={{ opacity: 0.85, fontVariantNumeric: "tabular-nums" }}>{fmtDurationMinutes(item.durationSec)}</div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 10,
  border: "1px solid var(--line)",
  borderRadius: 12,
};

const dotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  flexShrink: 0,
};
