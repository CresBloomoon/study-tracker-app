import { useEffect, useState } from "react";
import { listMilestones, type MilestoneSummary } from "@/lib/ui/scheduleApi";
import { jstDateKeyOf } from "@/lib/ui/jstDate";

// 「直近のアクティブなマイルストーン」= 締切日が今日(JST)以降で最も近いもの。
// 全て過ぎていれば最新（締切日が最も新しい）ものにフォールバックする。
function pickActiveMilestoneId(milestones: MilestoneSummary[]): string | null {
  if (milestones.length === 0) return null;
  const todayKey = jstDateKeyOf(new Date());
  const sorted = [...milestones].sort((a, b) => a.deadlineDate.localeCompare(b.deadlineDate));
  const upcoming = sorted.find((m) => m.deadlineDate >= todayKey);
  return (upcoming ?? sorted[sorted.length - 1]).id;
}

export function useMilestoneList() {
  const [milestones, setMilestones] = useState<MilestoneSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const list = await listMilestones();
      setMilestones(list);
      return list;
    } catch (e: any) {
      setErr(e?.message ?? "読み込みに失敗しました");
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { milestones, defaultActiveId: pickActiveMilestoneId(milestones), loading, err, refresh };
}
