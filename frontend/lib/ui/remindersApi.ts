export type Reminder = {
    id: string;
    title: string;
    dueAt: string;
    isDone: boolean;
    doneAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  
  export type ReminderSummary = {
    dueTodayOpenCount: number;
    openCount: number;
    doneCount: number;
    ranges: {
      todayJst: string;
      todayStartUtc: string;
      todayEndUtc: string;
    };
  };
  
  async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        "Content-Type": "application/json; charset=utf-8",
      },
      cache: "no-store",
    });
  
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        msg = j?.error?.message ?? msg;
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  }
  
  export function getReminderSummary(): Promise<ReminderSummary> {
    return fetchJson("/api/reminders/summary");
  }
  
  export function listReminders(status: "open" | "done" | "all" = "open"): Promise<Reminder[]> {
    return fetchJson(`/api/reminders?status=${status}`);
  }
  
  export function createReminder(params: { title: string; dueAt: string }): Promise<Reminder> {
    return fetchJson("/api/reminders", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }
  
  export function markDone(id: string): Promise<Reminder> {
    return fetchJson(`/api/reminders/${id}/done`, { method: "PATCH" });
  }
  
  export function markUndone(id: string): Promise<Reminder> {
    return fetchJson(`/api/reminders/${id}/undone`, { method: "PATCH" });
  }
  