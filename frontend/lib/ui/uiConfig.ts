// frontend/lib/ui/uiConfig.ts
// トースト通知まわりの微調整用の値を集約する（★ここが調整ポイント）。
// durationMs のデフォルト値は、UI移植元CPA-Dashboardの
// frontend/src/config/appConfig.ts にあった TOAST_DURATION_MS: 3000 を踏襲。
export const TOAST_CONFIG = {
  // 通常のトースト（元に戻す操作を伴わないもの）が自動的に消えるまでの表示時間（ms）
  durationMs: 3000,

  // フェードイン/アウトのduration（ms）。RemindersPanel.tsxの追加シート（rem-sheet-in, 140ms ease-out）と揃える
  fadeMs: 140,

  // リマインダー削除時の「元に戻す」猶予秒数（s）。
  // この秒数が経過するまでは実際のDELETE API呼び出しを遅延させ、
  // 「元に戻す」が押された場合はその呼び出し自体をキャンセルする。
  undoGraceSec: 5,
} as const;
