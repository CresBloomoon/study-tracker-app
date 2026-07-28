# ADR-008: Reminder API 設計（作成 / 一覧 / 完了トグル / サマリ）

- Status: Accepted
- Date: 2026-01-08

## Context
CPA Dashboard に「リマインダ（締切付きタスク）」機能を追加する。
複数端末（PC / iPad など）から利用する可能性があるため、端末ローカル状態に依存せず一貫した状態管理が必要。

既に Prisma + PostgreSQL を採用しており、Reminder テーブルは作成済み。
Backend は routes → usecases → repositories の構成で実装している。

## Decision
1. **Server を唯一の真実（Single Source of Truth）** とする  
   - Reminder の作成、完了/未完了は常にサーバで更新する  
   - クライアントは表示と操作要求のみを担当する

2. **完了/未完了の更新は PATCH を明示分割する**
   - `PATCH /api/reminders/:id/done`（isDone=true, doneAt=now）
   - `PATCH /api/reminders/:id/undone`（isDone=false, doneAt=null）
   - 理由：操作意図が明確で、UIから呼びやすく、競合時の挙動も説明しやすい

3. **一覧取得は status クエリで切り替える**
   - `GET /api/reminders?status=open|done|all`（default: open）
   - 理由：UIのタブ/フィルタと相性が良く、拡張もしやすい

4. **集計（サマリ）は専用エンドポイントを用意する**
   - `GET /api/reminders/summary`
   - 理由：UIのホーム/ダッシュボードで軽量に表示するため、一覧取得に依存させない

## Consequences
- クライアント間で状態がズレにくくなる（端末跨ぎでも整合が取りやすい）
- 完了トグルは2つのエンドポイントになるが、意図が明確で実装と運用が簡単
- 今後「期限切れ」「優先度」などのフィルタを追加しても設計を保ちやすい

## Notes
- DBスキーマ変更が発生する場合は必ず Prisma migration を作成し、schema と DB の乖離を防ぐ。
- 文字コード問題はクライアント送信時に `application/json; charset=utf-8` を指定する。
