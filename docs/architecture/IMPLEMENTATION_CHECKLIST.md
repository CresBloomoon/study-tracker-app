# 実装チェックリスト（DB事故防止） v1

このチェックリストは「StudyLog一次データは絶対に消えない」を守るための実装ガイドである。
実装中・レビュー前・本番反映前に必ず確認する。

---

## 0. 原則（絶対）
- [ ] StudyLog（一次データ）は **追加のみ**。更新/削除はしない（DBでも禁止）
- [ ] DB変更は **必ずマイグレーション**（履歴として残す）
- [ ] 変更前DBを読める互換性、または **明示的移行手順（backfill等）** を用意する
- [ ] 派生データ（DailySummary）は保存しない（毎回再計算）

---

## 1. マイグレーション運用
- [ ] `prisma db push` を使っていない（禁止）
- [ ] スキーマ変更は `migrate` を通している
- [ ] 破壊的変更（削除/型変更/NOT NULL化）を一発でやっていない  
      → 追加（nullable）→ backfill → 並行稼働 → 切替 → 削除 の順にしている
- [ ] 変更内容が `docs/architecture/DB_SCHEMA.md` に反映されている

---

## 2. データ保護（StudyLog）
- [ ] `study_logs` に対して UPDATE/DELETE をアプリから実行していない
- [ ] `study_logs` の不変性（DBトリガー）を残している
- [ ] `study_logs` の `duration_minutes` は **1〜1440** の範囲に収まる
- [ ] `ended_at > started_at` を必ず満たす（0分・マイナスを許さない）

---

## 3. 冪等性（clientRequestId）
- [ ] StartTimer 用：`timer_sessions.client_request_id` が UNIQUE
- [ ] StopTimerAndCreateStudyLog 用：`study_logs.client_request_id` が UNIQUE
- [ ] リトライ時は「同じ clientRequestId なら同じ結果」になる（重複ログができない）
- [ ] clientRequestId は UUID として扱う（文字列の適当生成をしない）

---

## 4. タイマー同時起動（v1方針：禁止）
- [ ] v1では同時起動を許可しない（running は常に1件）
- [ ] `timer_sessions` に「status=running は1件まで」の制約がある（部分ユニーク等）
- [ ] StartTimer が弾かれた場合、UIに「すでにタイマーが動作中」を表示できる設計になっている  
      ※文言は暫定でOK（後で改善）

---

## 5. 日付境界（JST 00:00）
- [ ] 集計は必ず JST 00:00 を境界にする
- [ ] 集計の基準は `study_date_jst`（もしくは started_at を Asia/Tokyo 変換した日付）で統一する
- [ ] サーバ・DBのタイムゾーン設定に依存しない（明示的に Asia/Tokyo を使う）

---

## 6. データ整合性（FK/参照）
- [ ] `study_logs.subject_id` は必ず `subjects.id` を参照する（孤児ログを作らない）
- [ ] 科目は物理削除しない（is_active で無効化）
- [ ] `subjects.name` は UNIQUE（表記ゆれの入口を潰す）

---

## 7. 失敗系（クラッシュ/通信断/再起動）
- [ ] Start後にブラウザが落ちても、再開時に「動作中セッション」を復元できる（timer_sessionsを参照）
- [ ] Stop失敗時、再試行で同じログが二重作成されない（clientRequestIdで担保）
- [ ] 「途中状態（timer_sessions）」と「確定ログ（study_logs）」を混ぜない

---

## 8. リリース前セルフ監査（最低テスト）
- [ ] Start → Stop → ログ1件が生成される
- [ ] Stopを連打/リトライしてもログが増えない（冪等）
- [ ] 2台目でStartしようとすると拒否される（同時起動禁止）
- [ ] 日付境界（23:59開始→跨ぎ等）の集計が JST で期待通りになる
- [ ] subject名変更/色変更しても過去ログ集計が壊れない

---

## 9. 禁止事項（事故りがち）
- [ ] 本番DBに対して手動で UPDATE/DELETE しない
- [ ] 既存カラムをいきなり削除しない
- [ ] 派生集計（DailySummary）を「保存」しない
- [ ] 「とりあえず通すため」に制約を緩めない（後で必ず爆発する）


## タイマー（ADR-013準拠）差分チェック

- [ ] StopTimerUseCase: StopでStudyLogを作っている → StopはTimerSessionの停止のみへ変更
- [ ] GetCurrentTimerUseCase: 18時間超でStudyLog自動生成 → 自動生成を廃止（必要なら自動Stopのみ）
- [ ] Record操作: StudyLog生成をサーバ側で行うAPI/UseCaseを追加（/timer/record など）
- [ ] Pomodoro FOCUS超過: phase=DONEでも「超過秒」を返せるようにする（UI表示/記録用）
- [ ] 記録後は必ずIDLEへ戻す（サーバの返却stateで担保）

