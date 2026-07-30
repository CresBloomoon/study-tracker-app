"use client";

import type { PaceStatus } from "@/lib/ui/scheduleApi";

// 受動的な色・アイコン表示のみ（能動的な通知・アラートは実装しない）
const CONFIG: Record<PaceStatus, { icon: string; color: string; label: string }> = {
  NO_REMINDERS: { icon: "–", color: "rgba(255,255,255,0.6)", label: "リマインダーなし" },
  COMPLETE: { icon: "✓", color: "#4ade80", label: "完了" },
  ON_TRACK: { icon: "●", color: "#4ade80", label: "順調" },
  DELAYED: { icon: "▲", color: "#f87171", label: "遅延" },
  NO_PACE_DATA: { icon: "?", color: "rgba(255,255,255,0.6)", label: "ペース不明" },
};

export default function PaceIndicator({ status }: { status: PaceStatus }) {
  const cfg = CONFIG[status];
  return (
    <span title={cfg.label} aria-label={cfg.label} style={{ color: cfg.color, fontSize: 12, fontWeight: 700 }}>
      {cfg.icon}
    </span>
  );
}
