"use client";

import type { SubjectTaskWithProgress } from "@/lib/ui/scheduleApi";
import type { SubjectMeta } from "@/lib/ui/reviewApi";
import { dateKeyToTimestamp } from "@/lib/ui/jstDate";

type Props = {
  task: SubjectTaskWithProgress;
  subject?: SubjectMeta;
  rangeStartMs: number;
  totalSpanMs: number;
};

// 現時点ではバー本体と進捗バッジ（完了数/全体数）の数字表示のみ。
// タップでの展開パネル・順調/遅延アイコンは後続チャンクで追加する。
export default function SubjectTaskBar({ task, subject, rangeStartMs, totalSpanMs }: Props) {
  const startMs = dateKeyToTimestamp(task.startDate);
  const endMs = dateKeyToTimestamp(task.endDate);
  const leftPct = ((startMs - rangeStartMs) / totalSpanMs) * 100;
  const widthPct = Math.max(((endMs - startMs) / totalSpanMs) * 100, 1.5);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 90, flexShrink: 0, fontSize: 12, fontWeight: 600 }}>{subject?.name ?? "?"}</span>
      <div style={{ position: "relative", flex: 1, height: 28 }}>
        <div
          title={`${task.startDate} 〜 ${task.endDate}`}
          style={{
            position: "absolute",
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            height: "100%",
            borderRadius: 8,
            background: subject?.colorHex ?? "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {task.progress.doneCount}/{task.progress.totalCount}
        </div>
      </div>
    </div>
  );
}
