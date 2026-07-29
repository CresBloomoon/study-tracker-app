import { useEffect, useMemo, useState } from "react";
import {
  getTimerCurrent,
  listSubjects,
  startTimer,
  stopTimer,
  resumeTimer,
  recordTimer,
  type Subject,
  type TimerCurrentResponse,
} from "@/lib/ui/timerApi";
import { createStudyLog } from "@/lib/ui/studyLogApi";
import { listReminders, type Reminder } from "@/lib/ui/remindersApi";
import type { TimerUiMode } from "../components/TimerModeTabs";

const IDLE_CURRENT: TimerCurrentResponse = { status: "IDLE", running: false, session: null };

function formatClock(totalSec: number): string {
  const s = Number.isFinite(totalSec) ? Math.max(0, Math.floor(totalSec)) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// タイマー画面のデータ取得・サーバー状態同期・派生値計算をすべて集約するフック。
// StudyTimer.tsx はこのフックを呼び出してUIを描画するだけの薄いコンポーネントになる。
export function useStudyTimer() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [uiMode, setUiMode] = useState<TimerUiMode>("STOPWATCH");
  const [current, setCurrent] = useState<TimerCurrentResponse>(IDLE_CURRENT);
  const [currentFetchedAtMs, setCurrentFetchedAtMs] = useState<number>(Date.now());

  const [note, setNote] = useState("");
  const [linkedReminderId, setLinkedReminderId] = useState<string | null>(null);

  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(0);

  const [pomodoroFocusMin, setPomodoroFocusMin] = useState(25);
  const [pomodoroBreakMin, setPomodoroBreakMin] = useState(5);
  const [pomodoroSets, setPomodoroSets] = useState(3);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  async function refreshCurrent() {
    const c = await getTimerCurrent();
    setCurrent(c);
    setCurrentFetchedAtMs(Date.now());
    return c;
  }

  async function refreshReminders() {
    const r = await listReminders("open");
    setReminders(r);
  }

  // 初期読み込み：科目一覧・現在のタイマー状態・未完了リマインダーを一括取得
  useEffect(() => {
    (async () => {
      try {
        const [subs, cur] = await Promise.all([listSubjects(), refreshCurrent()]);
        setSubjects(subs);
        if (subs.length > 0 && !selectedSubjectId && cur.status === "IDLE") {
          setSelectedSubjectId(subs[0].id);
        }
        if (cur.status !== "IDLE" && cur.session.subjectId) {
          setSelectedSubjectId(cur.session.subjectId);
        }
        await refreshReminders();
      } catch (e: any) {
        setErr(e?.message ?? "初期読み込みに失敗しました");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 進行中セッションが実在するときは、そのセッションの実モードにUIを合わせる
  // （MANUALはTimerSessionを持たない純粋なUI状態なので対象外）
  useEffect(() => {
    if (current.status !== "IDLE" && current.session.mode) {
      setUiMode(current.session.mode);
    }
  }, [current]);

  // RUNNING中は1秒ごとに再描画して経過時間を進める
  useEffect(() => {
    if (current.status !== "RUNNING") return;
    const id = window.setInterval(() => forceTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [current.status]);

  const displayElapsedSec = useMemo(() => {
    if (current.status === "IDLE") return 0;
    if (current.status === "PAUSED") return current.session.elapsedSec;
    const extraSec = Math.floor((Date.now() - currentFetchedAtMs) / 1000);
    return current.session.elapsedSec + extraSec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, currentFetchedAtMs]);

  const pomodoroRatio = useMemo(() => {
    if (current.status === "IDLE") return null;
    const { phaseStartedAt, phaseEndsAt } = current.session;
    if (!phaseStartedAt || !phaseEndsAt) return null;
    const start = new Date(phaseStartedAt).getTime();
    const end = new Date(phaseEndsAt).getTime();
    const total = end - start;
    if (total <= 0) return null;
    const remaining = end - Date.now();
    return Math.min(Math.max(remaining / total, 0), 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, currentFetchedAtMs, displayElapsedSec]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const circleClickable = uiMode !== "MANUAL" && subjects.length > 0 && !busy;

  async function handleCircleClick() {
    if (!circleClickable) return;
    setErr(null);
    setBusy(true);
    try {
      if (current.status === "IDLE") {
        if (!selectedSubjectId) return;
        const config =
          uiMode === "POMODORO"
            ? { focusMin: pomodoroFocusMin, breakMin: pomodoroBreakMin, totalSets: pomodoroSets }
            : undefined;
        await startTimer({
          subjectId: selectedSubjectId,
          clientRequestId: crypto.randomUUID(),
          mode: uiMode === "POMODORO" ? "POMODORO" : "STOPWATCH",
          config,
        });
      } else if (current.status === "RUNNING") {
        await stopTimer({ clientRequestId: crypto.randomUUID() });
      } else if (current.status === "PAUSED") {
        await resumeTimer({ clientRequestId: crypto.randomUUID() });
      }
      await refreshCurrent();
    } catch (e: any) {
      setErr(e?.message ?? "操作に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  const manualDurationSec = manualHours * 3600 + manualMinutes * 60;
  const canRecord =
    uiMode === "MANUAL"
      ? !!selectedSubjectId && manualDurationSec > 0
      : current.status === "PAUSED" && current.session.canRecord;

  async function handleRecord() {
    if (!canRecord || busy) return;
    setErr(null);
    setBusy(true);
    try {
      if (uiMode === "MANUAL") {
        await createStudyLog({
          subjectId: selectedSubjectId,
          durationSec: manualDurationSec,
          clientRequestId: crypto.randomUUID(),
          note: note.trim() || null,
          linkedReminderId,
        });
        setManualHours(0);
        setManualMinutes(0);
      } else {
        await recordTimer({
          clientRequestId: crypto.randomUUID(),
          note: note.trim() || null,
          linkedReminderId,
        });
        await refreshCurrent();
      }
      setNote("");
      setLinkedReminderId(null);
      await refreshReminders();
    } catch (e: any) {
      setErr(e?.message ?? "記録に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  const centerLabel =
    uiMode === "MANUAL"
      ? `${String(manualHours).padStart(2, "0")}:${String(manualMinutes).padStart(2, "0")}`
      : formatClock(displayElapsedSec);

  return {
    subjects,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedSubject,
    reminders,
    uiMode,
    setUiMode,
    current,
    note,
    setNote,
    linkedReminderId,
    setLinkedReminderId,
    manualHours,
    setManualHours,
    manualMinutes,
    setManualMinutes,
    pomodoroFocusMin,
    setPomodoroFocusMin,
    pomodoroBreakMin,
    setPomodoroBreakMin,
    pomodoroSets,
    setPomodoroSets,
    busy,
    err,
    displayElapsedSec,
    pomodoroRatio,
    circleClickable,
    canRecord,
    centerLabel,
    handleCircleClick,
    handleRecord,
  };
}
