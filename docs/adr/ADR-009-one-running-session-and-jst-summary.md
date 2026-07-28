# ADR-009: タイマー同時実行の排他とダッシュボード集計の基準（JST）

## Status
Accepted

## Context
- タイマーは「同時に複数 RUNNING を許さない」仕様とする。
- 端末の二重押下・多端末操作・再送などにより、同時に start が呼ばれる可能性がある。
- ダッシュボードの「今日/今週」は学習記録を集計して表示するが、集計の境界（いつから今日/今週か）がブレると表示と記録が不整合になる。

## Decision
### 1) 同時実行の排他
- アプリ層のチェック（`findRunning()` が存在したら 409）に加えて、
  DB層でも「RUNNING は同時に1件まで」を保証する。
- Postgres の部分ユニークインデックスで担保する。

例：
- `TimerSession(state='RUNNING')` に対して `UNIQUE` を張る

アプリ側は Prisma の `P2002`（unique constraint）を捕捉し、
`409 TIMER_ALREADY_RUNNING` を返す。

### 2) ダッシュボード集計の境界（JST）
- 「今日」「今週」の集計境界は JST（日本時間）基準で固定する。
- 今日：JST 00:00:00 から現在まで
- 今週：JST の週開始（暫定で月曜 00:00:00）から現在まで  
  ※週開始は将来要件で日曜始まり等に変更する可能性があるため、`startOfJstWeek()` に集約する。

ダッシュボードAPIは `todayMinutes`, `weekMinutes` を返す。

## Consequences
### Pros
- 多重 start が発生しても DB が最終防衛線になり、データ破壊しない。
- アプリ層だけの排他より堅牢（レースコンディション耐性）。
- 「今日/今週」の集計がJST固定になり、表示とユーザー感覚が一致する。

### Cons
- DBに部分ユニークインデックスを追加するためマイグレーションが必要。
- `startOfJstWeek()` の週開始定義が将来変わる可能性がある（ただし関数に閉じ込め済み）。

## Implementation Notes
- Prisma migration で partial unique index を追加する。
- StartTimerUseCase は
  - 先に `findRunning()` で 409 を返す（UX）
  - それでも競合した場合は P2002 を 409 に変換（防衛）
- DashboardSummaryUseCase は
  - `startOfJstDay(now)`, `startOfJstWeek(now)` を使う
  - Repository は集計単位を minutes とし、UI側で hours 表示に変換する

## Related
- migrations: `one_running_session`
- usecases: `StartTimerUseCase`, `GetDashboardSummaryUseCase`
- api: `GET /api/dashboard/summary`
