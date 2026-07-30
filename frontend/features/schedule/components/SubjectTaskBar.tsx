"use client";

import { useState } from "react";
import type { SubjectTaskWithProgress } from "@/lib/ui/scheduleApi";
import type { SubjectMeta } from "@/lib/ui/reviewApi";
import { dateKeyToTimestamp } from "@/lib/ui/jstDate";
import SubjectTaskExpandPanel from "./SubjectTaskExpandPanel";

type Props = {
  task: SubjectTaskWithProgress;
  subject?: SubjectMeta;
  rangeStartMs: number;
  totalSpanMs: number;
  onProgressChanged: () => void;
};

// バー本体+進捗バッジ（完了数/全体数）。タップで展開し、チェックボックス+タイトルのリストを表示する。
// 順調/遅延アイコンは次チャンクで追加する。
export default function SubjectTaskBar({ task, subject, rangeStartMs, totalSpanMs, onProgressChanged }: Props) {
  const [expanded, setExpanded] = useState(false);

  const startMs = dateKeyToTimestamp(task.startDate);
  const endMs = dateKeyToTimestamp(task.endDate);
  const leftPct = ((startMs - rangeStartMs) / totalSpanMs) * 100;
  const widthPct = Math.max(((endMs - startMs) / totalSpanMs) * 100, 1.5);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 90, flexShrink: 0, fontSize: 12, fontWeight: 600 }}>{subject?.name ?? "?"}</span>
        <div style={{ position: "relative", flex: 1, height: 28 }}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={`${task.startDate} 〜 ${task.endDate}`}
            style={{
              position: "absolute",
              left: `${leftPct}%`,
              width: `${widthPct}%`,
              height: "100%",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
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
          </button>
        </div>
      </div>

      {expanded && <SubjectTaskExpandPanel subjectTaskId={task.id} onProgressChanged={onProgressChanged} />}
    </div>
  );
}
