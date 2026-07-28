/**
 * Timer domain types
 * Server is the Single Source of Truth
 */

/**
 * TimerState
 * - RUNNING: タイマー進行中
 * - PAUSED : 一時停止中（未記録セッションあり）
 * - IDLE   : 未記録セッションなし（UI待機状態）
 */
export type TimerState = "RUNNING" | "PAUSED" | "IDLE";

/**
 * TimerSession
 * 未記録のタイマーセッション
 * ※ IDLE の場合は存在しない（null）
 */
export interface TimerSession {
  id: string;
  state: TimerState;

  subjectId: string;

  /** FOCUS / REST など（将来拡張前提） */
  mode: string;

  /** 現在のフェーズ（FOCUS / REST 等） */
  phase: string;

  /** 現在のセット番号（0 or 1 始まりはサーバ定義に従う） */
  setIndex: number;

  /** 総セット数 */
  totalSets: number;

  /** 開始時刻（UTC ISO8601） */
  startedAt: string;

  /** 一時停止時刻（PAUSED時のみ） */
  pausedAt: string | null;

  /** 終了時刻（Record前は null） */
  endedAt: string | null;

  /** 記録完了時刻（未記録中は null） */
  recordedAt: string | null;
}

/**
 * GET /api/timer/current のレスポンス
 */
export interface TimerCurrentResponse {
  state: TimerState;

  /** サーバ現在時刻（UTC ISO8601） */
  serverNow: string;

  /** 未記録セッション（IDLE の場合は null） */
  session: TimerSession | null;
}

/**
 * タイマー操作系 API の共通レスポンス
 * start / pause / resume / record
 */
export interface TimerActionResponse {
  state: TimerState;
  serverNow: string;
  session: TimerSession | null;
}
