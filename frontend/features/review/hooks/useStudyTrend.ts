import { useEffect, useState } from "react";
import { getMonthlyTrend, getYearlyTrend } from "@/lib/ui/reviewApi";

export type TrendItem = { label: string; minutes: number };

function useTrendItems<T extends { minutes: number }>(
  fetcher: () => Promise<{ items: T[] }>,
  labelOf: (item: T) => string
) {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetcher();
        setItems(res.items.map((it) => ({ label: labelOf(it), minutes: it.minutes })));
      } catch (e: any) {
        setErr(e?.message ?? "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, loading, err };
}

export function useMonthlyTrend() {
  return useTrendItems(getMonthlyTrend, (it) => it.month);
}

export function useYearlyTrend() {
  return useTrendItems(getYearlyTrend, (it) => it.year);
}
