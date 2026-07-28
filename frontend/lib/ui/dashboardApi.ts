export type DashboardSummary = {
    todayMinutes: number;
    weekMinutes: number;
  };
  
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api";
  
  export async function getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary`, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`dashboard/summary failed: ${res.status} ${text}`);
    }
    return res.json();
  }
  
  export function minutesToHours1(min: number): string {
    const h = min / 60;
    return h.toFixed(1);
  }
  