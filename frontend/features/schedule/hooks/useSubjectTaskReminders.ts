import { useEffect, useState } from "react";
import { listSubjectTaskReminders, type SubjectTaskReminderItem } from "@/lib/ui/scheduleApi";
import { markDone, markUndone } from "@/lib/ui/remindersApi";

// enabled=true（展開時）になって初めて取得する（畳んだバーの分まで先読みしない）
export function useSubjectTaskReminders(subjectTaskId: string, enabled: boolean, onChanged?: () => void) {
  const [items, setItems] = useState<SubjectTaskReminderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const list = await listSubjectTaskReminders(subjectTaskId);
      setItems(list);
    } catch (e: any) {
      setErr(e?.message ?? "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (enabled) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, subjectTaskId]);

  async function toggle(item: SubjectTaskReminderItem) {
    if (item.isDone) await markUndone(item.id);
    else await markDone(item.id);
    await refresh();
    // このSubjectTaskの進捗バッジ・遅延判定は親（マイルストーン詳細）側のデータなので、
    // トグル後にそちらの再取得も呼んでもらう
    onChanged?.();
  }

  return { items, loading, err, toggle };
}
