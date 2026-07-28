"use client";

import { useEffect, useMemo, useState } from "react";
import { getWeeklyStudy } from "@/features/dashboard/api/getWeeklyStudy";

function fmtMinutes(m: number) {
  const mm = Math.max(0, Math.floor(m));
  const h = Math.floor(mm / 60);
  const min = mm % 60;
  if (h <= 0) return `${min}m`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}m`;
}

export default function WeeklyChart() {
  const [items, setItems] = useState<{ date: string; minutes: number }[]>([]);
  const [period, setPeriod] = useState<{
    fromDate: string;
    toDate: string;
    mode: "CALENDAR_WEEK" | "LAST_7_DAYS";
    weekStartsOn: "MON" | "SUN";
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await getWeeklyStudy();
        setItems(data.items ?? []);
        setPeriod(data.weekPeriod ?? null);
      } catch (e: any) {
        setErr(e?.message ?? "failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const max = useMemo(() => {
    let m = 0;
    for (const it of items) m = Math.max(m, it.minutes ?? 0);
    return m;
  }, [items]);

  if (loading) return <div style={{ opacity: 0.8 }}>Loading...</div>;
  if (err) return <div style={{ opacity: 0.8 }}>Error: {err}</div>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700 }}>週間（{period?.fromDate} 〜 {period?.toDate}）</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>
          {period ? `${period.mode} / start:${period.weekStartsOn}` : ""}
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {items.map((it) => {
          const ratio = max > 0 ? (it.minutes / max) : 0;
          return (
            <div key={it.date} style={{ display: "grid", gridTemplateColumns: "90px 1fr 64px", gap: 10, alignItems: "center" }}>
              <div style={{ opacity: 0.85, fontVariantNumeric: "tabular-nums" }}>{it.date.slice(5)}</div>
              <div style={{ height: 10, borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden" }}>
                <div style={{ width: `${Math.round(ratio * 100)}%`, height: "100%" }} />
              </div>
              <div style={{ textAlign: "right", opacity: 0.85 }}>{fmtMinutes(it.minutes)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
