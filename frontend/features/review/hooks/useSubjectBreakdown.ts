import { useEffect, useState } from "react";
import { getSubjectBreakdown, type SubjectBreakdownItem } from "@/lib/ui/reviewApi";

export function useSubjectBreakdown() {
  const [items, setItems] = useState<SubjectBreakdownItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await getSubjectBreakdown();
        setItems(res.items);
      } catch (e: any) {
        setErr(e?.message ?? "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { items, loading, err };
}
