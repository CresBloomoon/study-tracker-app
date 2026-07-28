# ADR-007: UUIDデフォルトをDB側で保証し、Prisma Driftを履歴で解消する

- Status: Accepted
- Date: 2026-01-07

## Context

本プロジェクトは Prisma + PostgreSQL を採用している。  
`schema.prisma` では各モデルの `id` に `@default(uuid())` を指定しているため、通常は INSERT 時に UUID が自動採番されることを期待している。

しかし開発中に以下の事象が発生した。

- psql で `Subject` を手動 INSERT したところ、`id` が `null` となり `NOT NULL constraint` で失敗した
- DB実体を見ると、`Subject.id` に `DEFAULT` が付与されていなかった
- 応急対応として DB に `DEFAULT gen_random_uuid()` 等を手動で付与した結果、Prisma が Drift（migrations と実DBの不整合）を検知した
- Prisma は Drift を理由に `migrate dev --create-only` などのフローが止まり、`migrate reset`（DB全削除）を提案した

本番運用・再現性（Dockerで再構築可能）を重視しているため、DB全削除ではなく、履歴を正として整合を回復させる必要がある。

## Decision

以下を採用する。

1. UUID採番は Prisma のみへ依存せず、**DB側でも DEFAULT を保証**する  
   - `Subject`, `StudyLog`, `TimerSession` の `id` に `DEFAULT gen_random_uuid()` を付与
   - UUID生成のため `pgcrypto` extension を使用する（`gen_random_uuid()`）

2. 手動で適用済みのDB変更により発生した Drift は、**追加マイグレーションを作成し、履歴を追記して解消**する  
   - 追加の migration フォルダを作成し、上記の `CREATE EXTENSION` / `ALTER TABLE ... SET DEFAULT` を記載
   - DBには既に適用済みのため、`prisma migrate resolve --applied <migration>` により履歴へ反映する

3. `migrate reset` は原則使わない  
   - 開発中であっても、既存DBを読み取れること（再現性・デバッグ容易性）を優先する

## Consequences

### Pros
- psql などの手動操作でも UUID採番が成立し、デバッグや運用が安定する
- DockerでDBを再構築しても同じスキーマ状態を再現できる
- Prisma Drift を履歴で解消でき、安易なDBリセットを避けられる

### Cons / Risks
- `pgcrypto` extension に依存する（DB初期化時に有効化が必要）
- `migrate resolve` は履歴管理の操作であり、誤用すると整合性が壊れるため手順の理解が必須

## Implementation Notes

- 追加マイグレーション例:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "Subject"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "StudyLog"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "TimerSession"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
