# Step9追加対応：Reminder削除時のStudyLog不変トリガー500エラー修正

> これは設計判断の記録（ADR）ではなく、作業内容の記録（開発ログ）である。

- 対象Step: Step9（リマインダー削除機能）への追加対応
- 日付: 2026-08-01〜2026-08-02

## 概要

`DELETE /api/reminders/:id`で、紐づく`StudyLog`が存在するReminderを削除すると500エラーになる不具合を修正した。原因は`StudyLog.linkedReminderId`（`onDelete: SetNull`）がNULL化される際のUPDATEを、`forbid_study_log_mutation()`トリガーが無条件で拒否していたこと。トリガーに「`linkedReminderId`の非NULL→NULLのみ・他カラム不変」という限定条件での例外を追加し、ADR-001の不変性原則は維持したまま参照整合性を確保した。

## 変更ファイル一覧と責務

- `backend/prisma/migrations/20260801000000_allow_studylog_reminder_unlink/migration.sql`
  `forbid_study_log_mutation()`トリガー関数を`CREATE OR REPLACE FUNCTION`で更新。`linkedReminderId`解除のみを許可する条件分岐を追加し、DELETEおよびその他のUPDATEは従来通り拒否。既存の`20260107040940_init/migration.sql`は無変更。
- `docs/adr/ADR-018-studylog-immutable-exception-for-reminder-unlink.md`
  今回のトリガー例外追加という設計判断の記録（経緯・条件式・検証結果・代替案・トレードオフ）。
- `docs/dev-log/2026-08-session-handoff-studylog-trigger-fix.md`
  前回セッション終了時点の作業状況引き継ぎメモ（本対応の途中経過の記録として保持）。

## ADRの要否判断

**要**。理由：ADR-001（StudyLogは作成のみ・編集削除不可）というDBレベルで強制していた設計原則に、初めて例外を追加する決定であり、単なるバグ修正の実装詳細を超えて「なぜ不変性原則を緩めてよいと判断したか」「例外の範囲をどう限定したか」という設計判断そのものだったため。ADR-018として作成済み。

## ビルド確認結果

- マイグレーション適用済み：`docker compose exec backend npx prisma migrate dev`で適用成功。`_prisma_migrations`テーブルに`20260801000000_allow_studylog_reminder_unlink`が記録されていることを確認済み。
- 動作確認①（500エラー解消）：実データで、紐づく`StudyLog`を持つReminderを`DELETE /api/reminders/:id`で削除し、正常完了を確認。削除後、対応する`StudyLog.linkedReminderId`が`NULL`に更新されていることをDBで確認済み。
- 動作確認②（不変性の回帰確認）：`StudyLog`への直接UPDATE（`note`カラム変更）が引き続きトリガーに拒否されることを、`BEGIN`/`UPDATE`/`ROLLBACK`のトランザクションで確認済み（`ERROR: StudyLog is immutable: UPDATE/DELETE are forbidden`）。実データへの変更は発生せず。
- ブラウザでの目視確認（リマインダー画面から実際に1〜2件削除する操作）は未実施。まーくんが別途実施予定。

## 次のステップ

- まーくんによるブラウザでの目視確認（リマインダー1〜2件の削除）。
- スコープ外の申し送り事項：`StudyLog.subjectId`（`Subject`への`onDelete: SetNull`）にも同種の潜在バグが存在することが判明済み。現時点では`DeleteSubjectUseCase`が存在せず未顕在化だが、将来Subject削除機能を実装する際に同じ設計判断（ADR-018と同様の例外追加）が必要になる見込み。
