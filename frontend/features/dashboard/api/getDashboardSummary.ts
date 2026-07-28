import type { DashboardSummary } from "../types/dashboard";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const base = process.env.BACKEND_ORIGIN || "http://localhost:3000";

  try {
    const res = await fetch(`${base}/api/dashboard/summary`, { cache: "no-store" });
    if (!res.ok) throw new Error(`status=${res.status}`);
    const data = await res.json();

    return {
      todayMinutes: data.todayMinutes ?? 0,
      weekMinutes: data.weekMinutes ?? 0,
      weekPeriod: data.weekPeriod ?? {
        mode: "CALENDAR_WEEK",
        weekStartsOn: "MON",
        fromDate: "",
        toDate: "",
      },
      bySubject: Array.isArray(data.bySubject) ? data.bySubject : [],
    };
  } catch {
    return {
      todayMinutes: 0,
      weekMinutes: 0,
      weekPeriod: { mode: "CALENDAR_WEEK", weekStartsOn: "MON", fromDate: "", toDate: "" },
      bySubject: [],
    };
  }
}
