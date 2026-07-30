"use client";

import { useState } from "react";
import type { SubjectTaskWithProgress } from "@/lib/ui/scheduleApi";
import type { SubjectMeta } from "@/lib/ui/reviewApi";
import { dateKeyToTimestamp } from "@/lib/ui/jstDate";
import SubjectTaskExpandPanel from "./SubjectTaskExpandPanel";
import PaceIndicator from "./PaceIndicator";

type Props = {
  task: SubjectTaskWithProgress;
  subject?: SubjectMeta;
  rangeStartMs: number;
  totalSpanMs: number;
  onProgressChanged: () => void;
};

// バー本体+進捗バッジ（完了数/全体数）+順調/遅延アイコン。
// タップで展開し、チェックボックス+タイトルのリストを表示する。
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
              gap: 6,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <span>
              {task.progress.doneCount}/{task.progress.totalCount}
            </span>
            <span style={paceChipStyle}>
              <PaceIndicator status={task.progress.paceStatus} />
            </span>
          </button>
        </div>
      </div>

      {expanded && <SubjectTaskExpandPanel subjectTaskId={task.id} onProgressChanged={onProgressChanged} />}
    </div>
  );
}

// バーの背景色（科目カラー）が何であってもペースの色（緑/赤/灰）が読めるよう、白背景のチップに乗せる
const paceChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 16,
  height: 16,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.92)",
};
