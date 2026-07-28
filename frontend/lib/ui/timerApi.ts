// frontend/lib/ui/timerApi.ts

export type TimerCurrent =
  | {
      state: "STOPPED";
      serverNow: string; // ISO
      autoStopped?: boolean;
      reason?: string;
    }
  | {
      state: "RUNNING";
      sessionId: string;
      subjectId: string | null;
      startedAt: string; // ISO
      serverNow: string; // ISO
    };

export type TimerStartResponse = {
  sessionId: string;
  state: "RUNNING";
  subjectId: string | null;
  startedAt: string; // ISO
};

export type TimerStopResponse =
  | {
      status: "STOPPED";
      sessionId: string | null;
      startedAt: string;
      endedAt: string;
      durationSec: number;
      roundedMinutes: number;
      studyLogId: string;
    }
  | { status: "NO_RUNNING_SESSION" };

type BackendTimerSession = {
  id: string;
  state: "RUNNING" | "STOPPED";
  subjectId: string | null;
  startedAt: string;
  endedAt: string | null;
  clientRequestId: string | null;
  createdAt?: string;
  updatedAt?: string;
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

export function getTimerCurrent(): Promise<TimerCurrent> {
  return fetchJson("/api/timer/current");
}

export async function startTimer(params: {
  subjectId?: string | null;
  clientRequestId: string;
}): Promise<TimerStartResponse> {
  const raw = await fetchJson<TimerStartResponse | BackendTimerSession>("/api/timer/start", {
    method: "POST",
    body: JSON.stringify({
      subjectId: params.subjectId ?? null,
      clientRequestId: params.clientRequestId,
    }),
  });

  // 既に { sessionId, ... } 形式ならそのまま
  if ((raw as any).sessionId) return raw as TimerStartResponse;

  // Prismaモデル形式 { id, ... } をUIが使う形式に正規化
  const s = raw as BackendTimerSession;
  return {
    sessionId: s.id,
    state: "RUNNING",
    subjectId: s.subjectId,
    startedAt: s.startedAt,
  };
}

export function stopTimer(params: { clientRequestId: string }): Promise<TimerStopResponse> {
  return fetchJson("/api/timer/stop", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export type Subject = { id: string; name: string; colorHex: string; sortOrder: number };

export function listSubjects(): Promise<Subject[]> {
  return fetchJson("/api/subjects");
}
