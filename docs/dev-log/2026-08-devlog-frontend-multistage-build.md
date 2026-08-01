# 本番ビルドモードのfrontendをマルチステージビルド化

> **注記**: これは設計判断の記録（ADR）ではなく、作業内容の記録（開発ログ）である。設計判断そのものは`docs/adr/`配下のADRを参照すること。

- 日付: 2026-08-01
- 対象: Stepの区切りではないインフラ構成変更（本番ビルドモードのfrontendビルド方式変更）

## 概要

前回作成した`docker-compose.prod.yml`（本番ビルドモード）は、`image: node:20-alpine`＋ボリュームマウント＋`command`内で毎回`npm run build && npm run start`を実行する構成だったため、コンテナ起動のたびに`next build`が走ってしまっていた。これをマルチステージビルドの`frontend/Dockerfile`に切り出し、「イメージビルド時に`next build`を1回だけ実行して成果物をイメージに焼き込み、コンテナ起動時は`next start`のみを実行する」構成に変更した。

開発モード（`docker-compose.override.yml`、`npm run dev`＋ボリュームマウントでホットリロード）と共通設定（`docker-compose.yml`）は一切変更していない。

## 変更ファイル一覧と責務

| ファイル | 責務 |
|---|---|
| `frontend/Dockerfile`（新規、既存の空ファイルを実装） | 3ステージ構成（`deps`→`builder`→`runner`）。`deps`で`npm ci`、`builder`で`npm run build`、`runner`は`node_modules`・`.next`・`package.json`・`next.config.js`のみをコピーして`CMD`で`npm run start -- -H 0.0.0.0 -p 3000`を実行 |
| `docker-compose.prod.yml`（変更） | frontendサービスを`image: node:20-alpine`から`build: ./frontend`（+ 明示タグ`study-tracker-app-frontend:prod`）に変更。`volumes: !reset []`でベースの`./frontend:/app`・`study_tracker_app_frontend_node_modules`名前付きボリュームの両方を無効化（焼き込んだ本番用`node_modules`/`.next`が上書きされないようにするため）。`command:`セクションは全削除し、Dockerfileの`CMD`に一本化 |

## ADRの要否判断とその理由

判断：**不要**。ドメインロジック・API設計・DBスキーマの変更を伴わない、純粋なインフラ/ビルド方式の変更のため。開発モードの挙動（`docker compose up`だけでホットリロード付きの`npm run dev`が起動する）にも影響がない。

## ビルド確認結果

まーくんの手元環境で実施。

**1回目のビルド**（`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`）
- `builder`ステージの`next build`: 122.4s
- イメージビルド全体: 430.6s
- `docker compose logs frontend`には`next start`のログのみ（起動時ビルドが走っていないことを確認）
- `Ready in 1947ms`

**2回目のビルド**（ソース変更なしで再度`up -d --build`）
- 全16ステップがCACHED
- イメージビルド全体: 3.1s、起動もほぼ一瞬

ソースコード変更時のみ再ビルドが走り、変更がなければ起動が一瞬になる構成になったことを確認済み。

## 運用上の注意

本番ビルドモードで起動する際は、必ず`--build`オプションを付けること。

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

`--build`を付け忘れて`up -d`のみで起動すると、ソースコードを変更していても既存イメージがそのまま使われてしまい、変更が反映されない。`--build`を付けておけば、変更なしならキャッシュヒットで数秒起動、変更ありなら該当箇所のみ再ビルドされる。

## 次のステップ

特になし。`frontend/public`ディレクトリが将来追加された場合は、`frontend/Dockerfile`の`runner`ステージに`COPY --from=builder /app/public ./public`の追記が必要になる（現時点では`public/`が存在しないため意図的に省略している）。
