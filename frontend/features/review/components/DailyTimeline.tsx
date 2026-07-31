"use client";

import { useDailyTimeline } from "../hooks/useDailyTimeline";
import DailyTimelineHeader from "./DailyTimelineHeader";
import StudyLogEntryRow from "./StudyLogEntryRow";

export default function DailyTimeline() {
  const { dateKey, data, subjectMap, reminderMap, toggleReminderDone, loading, err, goPrevDay, goNextDay } =
    useDailyTimeline();

  return (
    <div style={cardStyle}>
      <DailyTimelineHeader
        dateKey={dateKey}
        onPrevDay={goPrevDay}
        onNextDay={goNextDay}
        totalMinutes={data?.totalMinutesRoundedUp ?? 0}
      />

      {loading && <div style={{ opacity: 0.7, marginTop: 12 }}>読み込み中...</div>}
      {err && <div style={{ color: "#fca5a5", marginTop: 12 }}>{err}</div>}

      {!loading && !err && (
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {(data?.items.length ?? 0) === 0 ? (
            <div style={{ opacity: 0.7 }}>この日の記録はありません</div>
          ) : (
            data!.items.map((item) => (
              <StudyLogEntryRow
                key={item.id}
                item={item}
                subject={item.subjectId ? subjectMap.get(item.subjectId) : undefined}
                linkedReminder={item.linkedReminderId ? reminderMap.get(item.linkedReminderId) : undefined}
                onToggleReminder={toggleReminderDone}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.02)",
};
