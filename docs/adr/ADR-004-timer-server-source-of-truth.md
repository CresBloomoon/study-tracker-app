# ADR-004: Timer is Server-Side Source of Truth

## Status
Accepted

## Context

本アプリでは学習時間を計測するための「タイマー機能」を提供している。

v1 実装では以下のような課題が確認された。

- 複数端末（例：デスクトップPC / MacBook）から同一ユーザがアクセス可能
- タイマーの状態や経過時間をクライアント（localStorage 等）に依存している
- 別端末でタイマーを動かしっぱなしにした結果、
  - 1日の学習時間が 24 時間を超過する
  - localStorage を clear しても、後続の同期や集計で全体に反映されてしまう
- クライアント状態とサーバ状態の乖離が発生しやすく、事故検知が困難

学習時間データは本アプリの中核的価値であり、
**会計データ同様に「一意で整合性の取れた真実（Single Source of Truth）」が必要**
と判断した。

## Decision

タイマー機能において、**サーバを唯一の真実（Source of Truth）とする**設計を採用する。

具体的には以下を原則とする。

- タイマーの開始・停止は **必ずサーバで発行・管理**する
- クライアントは以下の責務に限定する
  - 開始 / 停止操作の送信
  - サーバ状態の表示
- サーバは「現在稼働中のタイマーセッション」を保持する
- ユーザごとに **同時にアクティブなタイマーセッションは最大 1 件**とする

## Consequences

### Positive

- 複数端末からアクセスしても状態が一貫する
- localStorage の破損・リセットによる事故を防止できる
- 「タイマーつけっぱなし」などの異常値をサーバ側で検知・対処しやすい
- セッション単位での保存により、将来的に以下が可能
  - 異常セッションの無効化・補正
  - 編集・分割機能の追加
  - 高度な分析・集計

### Negative / Trade-offs

- クライアント単独ではタイマーが完結しない
- オフライン時の完全な計測は困難（v1 では許容）
- サーバ実装・DB設計がやや複雑になる

## Implementation Notes

### API 概要（例）

- `POST /timer/start`
- `POST /timer/stop`
- `GET /timer/active`

### データモデル（将来想定）

- timer_sessions
  - id
  - user_id
  - started_at (timestamptz)
  - stopped_at (timestamptz, nullable)
  - source_client_id（任意）
  - note（任意）

制約：
- `stopped_at IS NULL` のセッションは user_id ごとに最大 1 件

### クライアント実装方針

- 経過時間は `started_at` を基準に計算
- クライアント時刻は信頼しない
- localStorage には client_id 等の識別子のみ保存する

## Migration

本 ADR に基づく設計は v2 以降で段階的に導入する。

- v1 データとの互換性を維持するため、
  - 既存 DB を読み取れる状態を保持する
  - 必要に応じてセッション形式への変換マイグレーションを実施する
- DB スキーマ変更時は **必ずマイグレーションを作成する**

## Related ADRs

- ADR-001: StudyLog Immutable
- ADR-002: DailySummary Derived
- ADR-003: Time Rounding Up
