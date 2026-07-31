import { useEffect, useMemo, useState } from "react";
import {
  getStudyLogByDate,
  listAllSubjects,
  type StudyLogByDateResponse,
  type SubjectMeta,
} from "@/lib/ui/reviewApi";
import { listReminders, markDone, markUndone, type Reminder } from "@/lib/ui/remindersApi";
import { jstDateKeyOf, shiftDateKey } from "@/lib/ui/jstDate";

// 日別タイムラインのデータ取得・日付ナビゲーション状態を集約するフック
export function useDailyTimeline() {
  const [dateKey, setDateKey] = useState<string>(() => jstDateKeyOf(new Date()));
  const [data, setData] = useState<StudyLogByDateResponse | null>(null);
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listAllSubjects()
      .then(setSubjects)
      .catch(() => {
        // 科目名解決に失敗しても一覧自体は表示したいので、ここでは握りつぶす
      });
    // StudyLog.linkedReminderIdの解決用。日付に紐付かないため日付切り替えとは別に一度だけ取得する
    listReminders("all")
      .then(setReminders)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const d = await getStudyLogByDate(dateKey);
        if (!cancelled) setData(d);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "読み込みに失敗しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const reminderMap = useMemo(() => new Map(reminders.map((r) => [r.id, r])), [reminders]);

  function goPrevDay() {
    setDateKey((k) => shiftDateKey(k, -1));
  }
  function goNextDay() {
    setDateKey((k) => shiftDateKey(k, 1));
  }

  async function toggleReminderDone(reminder: Reminder) {
    const updated = reminder.isDone ? await markUndone(reminder.id) : await markDone(reminder.id);
    setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return { dateKey, data, subjectMap, reminderMap, toggleReminderDone, loading, err, goPrevDay, goNextDay };
}
