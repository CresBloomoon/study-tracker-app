# ADR-006: Adopt Prisma v7 config-based datasource and one-command Docker Compose bootstrap

## Status
Accepted

## Context
本プロジェクト（CPA-Dashboard-Core）は、以下の制約と要件を持つ。

- ローカル開発環境を汚さない（Node.js / npm / Prisma はホストに直接インストールしない）
- Docker Compose によるワンコマンド起動を実現したい
- DB は PostgreSQL を使用する
- Prisma を ORM として採用する

Prisma v7 以降では、従来の `schema.prisma` における `datasource.url` の指定が非推奨となり、
以下のような変更が導入された。

- DB 接続情報は `prisma.config.ts` に集約する
- Prisma Client は adapter または Accelerate 経由で初期化する必要がある
- `new PrismaClient()` を引数なしで生成すると初期化エラーが発生する

また、Docker 開発において以下の課題があった。

- 毎回コンテナに入って `npm ci` や `prisma generate` を手動実行していた
- 再起動・再ビルド時の再現性が低かった
- 「compose up だけで動く」状態になっていなかった

## Decision
以下の設計判断を行う。

### Prisma 構成
- Prisma v7 を正式採用する
- DB 接続情報は `prisma.config.ts` に定義する
- `schema.prisma` にはモデル定義のみを記述する
- Prisma Client は `@prisma/adapter-pg` + `pg` を用いた direct database connection を採用する

### Docker Compose 運用
- backend は `docker compose up -d --build` のワンコマンドで起動できる構成とする
- アプリケーションコードはホストで編集し、`./backend:/app` としてマウントする
- `node_modules` は named volume に切り出し、ホスト環境を汚さない
- 起動時に以下を自動実行する
  - 初回のみ `npm ci`
  - 毎回 `prisma generate`
  - アプリケーション起動（`node index.js`）
- DB 起動待ちは `depends_on + healthcheck` により保証する

### 運用 API
- backend 起動および DB 疎通確認用として `/api/health` エンドポイントを実装する
- このエンドポイントは Prisma 経由で実 DB にクエリを投げることで健全性を確認する

## Consequences
### 利点
- Docker Compose のワンコマンド起動が実現され、再現性が高まった
- ホスト環境を汚さずに Prisma / Node.js 開発が可能になった
- Prisma v7 の公式設計思想に準拠し、将来のアップデート耐性が向上した
- 初期セットアップ以降は起動時間が安定し、開発体験が向上した

### 欠点 / トレードオフ
- adapter-pg / pg などの依存が追加される
- 初回起動時のみ `npm ci` により時間がかかる
- Prisma v7 の理解コストは v6 以前より高い

## Operational Notes
- DB スキーマ変更時は **必ず Prisma migrate を実行する**
  - 既存 DB を読める状態を維持すること
  - 破壊的変更は原則禁止とする
- Prisma Client の生成失敗は、adapter / config 不整合を疑う
- Windows PowerShell の `curl` は alias のため、`curl.exe` の使用を推奨する

## Related
- ADR-005-migrations.md
- docker-compose.yml
- prisma.config.ts
- prisma/schema.prisma
