// frontend/lib/ui/timerApi.ts
//
// バックエンドのタイマー状態機械（ADR-015: RUNNING/PAUSED/IDLEの3状態、
// start/stop/resume/record/currentの5エンドポイント）に対応するAPIクライアント。
// エンドポイントごとに応答形が異なるため、無理に単一の型へ統一しない。

import { apiGet, apiPost } from "./apiClient";

export type TimerMode = "STOPWATCH" | "POMODORO";
export type PomodoroPhase = "FOCUS" | "BREAK" | "DONE";
export type PomodoroAwaitingAfterPhase = "BREAK" | "FOCUS";

export type PomodoroConfig = {
  focusMin: number;
  breakMin: number;
  totalSets: number;
};

export type TimerSessionSummary = {
  id: string;
  subjectId: string | null;
  startedAt: string;
  endedAt: string | null;
  elapsedSec: number;
  mode: TimerMode | null;
  phase: PomodoroPhase | null;
  setIndex: number | null;
  totalSets: number | null;
  phaseStartedAt: string | null;
  phaseEndsAt: string | null;
  awaitingAfterPhase: PomodoroAwaitingAfterPhase | null;
  isAbandoned: boolean;
  canRecord: boolean;
};

export type TimerCurrentResponse =
  | { status: "IDLE"; running: false; session: null }
  | { status: "RUNNING" | "PAUSED"; running: boolean; session: TimerSessionSummary };

export function getTimerCurrent(): Promise<TimerCurrentResponse> {
  return apiGet<TimerCurrentResponse>("/api/timer/current");
}

// POST /timer/start は生のTimerSessionレコードをそのまま返す（他エンドポイントのような整形はしていない）
export type TimerStartResponse = {
  id: string;
  state: "RUNNING";
  subjectId: string | null;
  startedAt: string;
  clientRequestId: string | null;
  mode: TimerMode;
  configJson: PomodoroConfig | null;
  phase: PomodoroPhase | null;
  setIndex: number | null;
  totalSets: number | null;
};

export function startTimer(params: {
  subjectId?: string | null;
  clientRequestId: string;
  mode?: TimerMode;
  config?: PomodoroConfig;
}): Promise<TimerStartResponse> {
  return apiPost<TimerStartResponse>("/api/timer/start", params);
}

export type TimerStopResponse =
  | {
      status: "PAUSED";
      sessionId: string;
      startedAt: string;
      endedAt: string;
      durationSec: number;
      roundedMinutes: number;
      studyLogId: string | null;
      idempotent?: boolean;
    }
  | { status: "STOP_NOT_ALLOWED"; reason: string; currentState: string; sessionId?: string };

export function stopTimer(params: { clientRequestId: string }): Promise<TimerStopResponse> {
  return apiPost<TimerStopResponse>("/api/timer/stop", params);
}

export type TimerResumeResponse =
  | { status: "RUNNING"; sessionId: string; startedAt: string }
  | { status: "NO_SESSION_TO_RESUME" }
  | { status: "RESUME_NOT_ALLOWED"; reason: string; currentState: string; sessionId: string }
  | { status: "ALREADY_RESUMED"; sessionId: string; state: string };

export function resumeTimer(params: { clientRequestId: string }): Promise<TimerResumeResponse> {
  return apiPost<TimerResumeResponse>("/api/timer/resume", params);
}

export type TimerRecordResponse =
  | {
      status: "RECORDED";
      sessionId: string | null;
      studyLogId: string;
      startedAt: string;
      endedAt: string;
      durationSec: number;
      roundedMinutes: number;
      note?: string | null;
      linkedReminderId?: string | null;
      idempotent?: boolean;
    }
  | { status: "RECORD_NOT_ALLOWED"; reason: string; currentState?: string; sessionId?: string };

export function recordTimer(params: {
  clientRequestId: string;
  note?: string | null;
  linkedReminderId?: string | null;
}): Promise<TimerRecordResponse> {
  return apiPost<TimerRecordResponse>("/api/timer/record", params);
}

export type Subject = { id: string; name: string; colorHex: string; sortOrder: number };

export function listSubjects(): Promise<Subject[]> {
  return apiGet<Subject[]>("/api/subjects");
}
