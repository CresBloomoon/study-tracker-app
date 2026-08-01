# docker-compose.yml の分割（開発モード/本番ビルドモードの切り替え）

> **注記**: これは設計判断の記録（ADR）ではなく、作業内容の記録（開発ログ）である。設計判断そのものは`docs/adr/`配下のADRを参照すること。

- 日付: 2026-08-01
- 対象: Stepの区切りではないインフラ構成変更（`docker-compose.yml`のfrontendサービス分割）

## 概要

`docker-compose.yml`のfrontendサービスから`command`を切り出し、開発モード（`npm run dev`）と本番ビルドモード（`npm run build && npm run start`）を`-f`オプションで切り替えられるようにした。`docker compose up -d`だけで従来通り開発モードが起動する後方互換性を維持する。

## 変更ファイル一覧と責務

| ファイル | 責務 |
|---|---|
| `docker-compose.yml` | db・backend（変更なし）＋frontendの共通設定（image/ports/volumes/environment等）。`command`は含めない |
| `docker-compose.override.yml`（新規） | frontend用。`command`は従来通り`npm run dev -- -H 0.0.0.0 -p 3000`（node_modulesインストール確認ロジックも現状維持） |
| `docker-compose.prod.yml`（新規） | frontend用。`command`は`npm run build && npm run start -- -H 0.0.0.0 -p 3000`（node_modulesインストール確認ロジックはoverride.ymlと同一） |

docker composeは`-f`未指定時に`docker-compose.yml`と`docker-compose.override.yml`をカレントディレクトリから自動マージする標準挙動を持つため、`docker compose up -d`だけで開発モードになる。本番ビルドモードは`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`で明示的に指定する。

## ADRの要否判断とその理由

判断：**不要**。ドメインロジック・API設計・DBスキーマの変更を伴わない、純粋なインフラ/開発環境の構成変更のため。`docker compose up`だけなら従来通り動作するという後方互換性も維持しており、新しい運用ルールの決定ではなく既存動作を保ったままの構成整理と位置付けている。

## 動作確認結果

まーくんの手元環境で実施。

**開発モード**（`docker compose up -d`）
- db/backend/frontend 全コンテナ Started
- `docker compose logs frontend`: `[bootstrap] start next dev...` → `next dev -H 0.0.0.0 -p 3000` → `Ready in 8.2s`

**本番ビルドモード**（`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`）
- db/backend/frontend 全コンテナ Started
- `docker compose logs frontend`: `[bootstrap] build next...` → `Compiled successfully in 40s` → `[bootstrap] start next prod...` → `next start -H 0.0.0.0 -p 3000` → `Ready in 1389ms`

両モードともポートマッピング（frontend:5175, backend:3001, db:5435）に変化なし。`docker compose down`時の「Network ... Resource is still in use」警告はclaude-devコンテナ接続によるもので実害なし（想定通り）。

## 次のステップ

特になし。本番ビルドモードは必要になったタイミングで`-f docker-compose.yml -f docker-compose.prod.yml`を使う運用とする。
