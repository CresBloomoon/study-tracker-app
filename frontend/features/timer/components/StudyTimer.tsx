"use client";

import { useStudyTimer } from "../hooks/useStudyTimer";
import TimerModeTabs from "./TimerModeTabs";
import SubjectSelect from "./SubjectSelect";
import PomodoroConfigField, { pomodoroConfigStyle } from "./PomodoroConfigField";
import TimerCircle from "./TimerCircle";
import NoteAndReminderFields from "./NoteAndReminderFields";
import { outerStyle, backgroundGlowStyle, errStyle, recordButtonStyle } from "./StudyTimer.styles";

export default function StudyTimer() {
  const t = useStudyTimer();

  return (
    <div style={outerStyle}>
      <div style={backgroundGlowStyle} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <TimerModeTabs mode={t.uiMode} disabled={t.current.status !== "IDLE"} onChange={t.setUiMode} />
        </div>

        <SubjectSelect
          subjects={t.subjects}
          selectedSubjectId={t.selectedSubjectId}
          onChange={t.setSelectedSubjectId}
          disabled={t.current.status !== "IDLE"}
        />

        {t.uiMode === "POMODORO" && t.current.status === "IDLE" && (
          <div style={pomodoroConfigStyle}>
            <PomodoroConfigField label="集中(分)" value={t.pomodoroFocusMin} onChange={t.setPomodoroFocusMin} min={1} max={180} />
            <PomodoroConfigField label="休憩(分)" value={t.pomodoroBreakMin} onChange={t.setPomodoroBreakMin} min={0} max={60} />
            <PomodoroConfigField label="セット数" value={t.pomodoroSets} onChange={t.setPomodoroSets} min={1} max={10} />
          </div>
        )}

        <TimerCircle
          uiMode={t.uiMode}
          clickable={t.circleClickable}
          onClick={t.handleCircleClick}
          pomodoroRatio={t.pomodoroRatio}
          ringColor={t.selectedSubject?.colorHex ?? "#38bdf8"}
          centerLabel={t.centerLabel}
          manualHours={t.manualHours}
          manualMinutes={t.manualMinutes}
          onManualHoursChange={t.setManualHours}
          onManualMinutesChange={t.setManualMinutes}
          dimmed={t.uiMode !== "MANUAL" && t.subjects.length === 0}
        />

        <NoteAndReminderFields
          note={t.note}
          onNoteChange={t.setNote}
          reminders={t.reminders}
          linkedReminderId={t.linkedReminderId}
          onLinkedReminderChange={t.setLinkedReminderId}
        />

        {t.err && <div style={errStyle}>{t.err}</div>}

        <button
          type="button"
          disabled={!t.canRecord || t.busy}
          onClick={t.handleRecord}
          style={recordButtonStyle(!t.canRecord || t.busy)}
        >
          記録
        </button>
      </div>
    </div>
  );
}
