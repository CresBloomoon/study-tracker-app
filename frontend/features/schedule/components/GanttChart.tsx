"use client";

import { useMemo } from "react";
import type { MilestoneDetail } from "@/lib/ui/scheduleApi";
import type { SubjectMeta } from "@/lib/ui/reviewApi";
import { dateKeyToTimestamp } from "@/lib/ui/jstDate";
import SubjectTaskBar from "./SubjectTaskBar";

type Props = {
  milestone: MilestoneDetail;
  subjectMap: Map<string, SubjectMeta>;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PADDING_DAYS = 3;

function computeRange(milestone: MilestoneDetail) {
  const dates = [
    ...milestone.subjectTasks.map((t) => dateKeyToTimestamp(t.startDate)),
    ...milestone.subjectTasks.map((t) => dateKeyToTimestamp(t.endDate)),
    dateKeyToTimestamp(milestone.deadlineDate),
  ];
  const rangeStartMs = Math.min(...dates) - PADDING_DAYS * DAY_MS;
  const rangeEndMs = Math.max(...dates) + PADDING_DAYS * DAY_MS;
  return { rangeStartMs, rangeEndMs };
}

function clampPct(v: number) {
  return Math.min(100, Math.max(0, v));
}

// マイルストーンの締切日を赤い縦線で示し、その下に科目バーを並べるガント本体
export default function GanttChart({ milestone, subjectMap }: Props) {
  const { rangeStartMs, rangeEndMs } = useMemo(() => computeRange(milestone), [milestone]);
  const totalSpanMs = Math.max(rangeEndMs - rangeStartMs, DAY_MS);
  const deadlineLeftPct = clampPct(((dateKeyToTimestamp(milestone.deadlineDate) - rangeStartMs) / totalSpanMs) * 100);

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{milestone.name}</div>
      <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 16 }}>締切: {milestone.deadlineDate}</div>

      {milestone.subjectTasks.length === 0 ? (
        <div style={{ opacity: 0.7 }}>科目バーがまだありません</div>
      ) : (
        <div style={{ position: "relative" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${deadlineLeftPct}%`,
              width: 2,
              background: "#ef4444",
              zIndex: 1,
            }}
          />
          <div style={{ display: "grid", gap: 12 }}>
            {milestone.subjectTasks.map((task) => (
              <SubjectTaskBar
                key={task.id}
                task={task}
                subject={subjectMap.get(task.subjectId)}
                rangeStartMs={rangeStartMs}
                totalSpanMs={totalSpanMs}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
