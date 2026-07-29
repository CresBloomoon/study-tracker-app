import { useEffect, useState } from "react";
import { getMilestone, type MilestoneDetail } from "@/lib/ui/scheduleApi";

export function useMilestoneDetail(milestoneId: string | null) {
  const [detail, setDetail] = useState<MilestoneDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    if (!milestoneId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const d = await getMilestone(milestoneId);
      setDetail(d);
    } catch (e: any) {
      setErr(e?.message ?? "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestoneId]);

  return { detail, loading, err, refresh };
}
