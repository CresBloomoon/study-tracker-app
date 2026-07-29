"use client";

import type { MilestoneSummary } from "@/lib/ui/scheduleApi";

type Props = {
  milestones: MilestoneSummary[];
  selectedId: string | null;
  onChange: (id: string) => void;
};

export default function MilestoneSelector({ milestones, selectedId, onChange }: Props) {
  if (milestones.length === 0) return null;

  return (
    <select value={selectedId ?? ""} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
      {milestones.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}（〆{m.deadlineDate}）
        </option>
      ))}
    </select>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fg)",
  fontSize: 13,
};
