# ADR-018: StudyLog不変性の例外（Reminder削除時のlinkedReminderId解除）

- Status: Accepted
- Date: 2026-08-02

## Context

ADR-001で定めたとおり、`StudyLog`は「作成のみ・編集削除不可」の一次データ台帳であり、`20260107040940_init`マイグレーションの`forbid_study_log_mutation()`トリガーがUPDATE/DELETEを条件分岐なしに`RAISE EXCEPTION`で拒否することで、この原則をDBレベルで強制していた。

Step9で`DELETE /api/reminders/:id`（Reminder削除）を実装したところ、紐づく`StudyLog`が存在するReminderを削除すると500エラーになる不具合が発生した。原因は`schema.prisma`上の`StudyLog.linkedReminderId`が`Reminder`への`onDelete: SetNull`参照であるため、Reminder削除時にPrismaが該当`StudyLog`行に対して`linkedReminderId`をNULLにするUPDATEを発行するが、これが上記トリガーに無条件で阻まれ、Postgresエラー（P0001）がそのままAPIの500エラーとして露出していたためである。

この問題は「StudyLogの不変性」（ADR-001）と「Reminder削除機能」という2つの正しい設計判断が衝突した結果であり、どちらか一方を単純に取り下げるのではなく、不変性の原則を維持したまま、参照整合性維持のために本当に必要な範囲だけを例外として認める設計を選んだ。

## Decision

ADR-001の原則（StudyLogは作成のみ・編集削除不可）はそのまま維持する。その上で、`forbid_study_log_mutation()`トリガー関数に、**「Reminder側の参照整合性維持のためだけに発生する、`linkedReminderId`の非NULL→NULLへのUPDATE」1種類に限定した例外**を追加した（`20260801000000_allow_studylog_reminder_unlink`マイグレーション）。

トリガーの条件式（該当箇所抜粋）:

```sql
IF TG_OP = 'UPDATE' THEN
  IF NEW."linkedReminderId" IS NULL
     AND OLD."linkedReminderId" IS NOT NULL
     AND NEW."subjectId"        IS NOT DISTINCT FROM OLD."subjectId"
     AND NEW."startedAt"        IS NOT DISTINCT FROM OLD."startedAt"
     AND NEW."endedAt"          IS NOT DISTINCT FROM OLD."endedAt"
     AND NEW."durationSec"      IS NOT DISTINCT FROM OLD."durationSec"
     AND NEW."note"             IS NOT DISTINCT FROM OLD."note"
     AND NEW."clientRequestId"  IS NOT DISTINCT FROM OLD."clientRequestId"
     AND NEW."createdAt"        IS NOT DISTINCT FROM OLD."createdAt"
  THEN
    RETURN NEW;
  END IF;
END IF;

RAISE EXCEPTION 'StudyLog is immutable: UPDATE/DELETE are forbidden';
```

- 許可される変更は`linkedReminderId`の値そのもの1カラムに限定し、`subjectId`/`startedAt`/`endedAt`/`durationSec`/`note`/`clientRequestId`/`createdAt`はすべて`IS NOT DISTINCT FROM`で不変チェックする。1カラムでも値が変われば例外は成立せず、従来通り`RAISE EXCEPTION`で拒否される。
- DELETEは分岐を追加せず、従来通り無条件で拒否したまま変更していない。
- 既存の`20260107040940_init/migration.sql`は変更せず、新規マイグレーションで`CREATE OR REPLACE FUNCTION`により上書きする形を取った（`docs/architecture/MIGRATION_GUIDE.md`の非破壊的変更の方針に従う）。
- 「訂正・修正のための編集」は引き続き一切許可しない。今回の例外はあくまで「参照先Reminderが削除されたことに伴う参照整合性の後始末」に限定されており、StudyLogが表す学習記録の内容（科目・時刻・時間・メモ等）はどのカラムも一切変更を許さない。

### 検証結果

マイグレーション適用後、以下2点を実データで確認した。

1. **500エラーの解消**：紐づく`StudyLog`を持つReminderを`DELETE /api/reminders/:id`で削除し、正常に完了することを確認した（対象Reminder削除後、DB上で`Reminder`行が消え、対応する`StudyLog.linkedReminderId`が`NULL`に更新されていることを確認済み）。
2. **不変性の回帰確認**：`StudyLog`への直接UPDATE（`linkedReminderId`以外のカラム変更）が引き続き拒否されることを、`BEGIN`/`UPDATE`/`ROLLBACK`のトランザクションで確認した。

   ```sql
   BEGIN;
   UPDATE "StudyLog" SET note = 'TEST_UPDATE_SHOULD_BE_REJECTED' WHERE id = '2243fb3c-f5a1-43cb-a2d0-fe9b89a91794';
   ROLLBACK;
   ```

   実行結果：

   ```
   BEGIN
   ERROR:  StudyLog is immutable: UPDATE/DELETE are forbidden
   CONTEXT:  PL/pgSQL function forbid_study_log_mutation() line 18 at RAISE
   ```

   トランザクションはエラーで中断され、実データへの変更は発生していない。

## Alternatives Considered

- **Reminder削除UseCase側で`StudyLog.linkedReminderId`を先にNULL化してからReminderを削除する（アプリ層で回避）**：トリガーには手を入れずに済むが、`StudyLog`はUseCase層からも一切更新されないという既存の不変条件（ADR-001）に反する。UseCase層のコードに「StudyLogを更新する経路」が生まれてしまうこと自体が将来の事故（意図しない更新の追加）の温床になるため不採用。
- **`Reminder`側の外部キーを`onDelete: SetNull`から`onDelete: Restrict`に変更し、紐づくStudyLogがあるReminderは削除不可にする**：シンプルだが、ユーザーから見て「関連する学習記録があるとリマインダーを永久に削除できない」という強い制約になり、プロダクト要件上望ましくないため不採用。
- **トリガー自体を撤廃し、アプリ層の規律のみでStudyLogの不変性を守る**：DBレベルの強制力を失い、将来UseCaseが増えた際に不変性が静かに破られるリスクが上がるため不採用。DBトリガーによる強制は維持しつつ、必要な例外だけを最小限追加する方針を優先した。

## Consequences

### Positive
- `StudyLog`の不変性は「`linkedReminderId`の解除」という1種類の狭い例外を除いて、ADR-001の原則どおりDBレベルで強制され続ける。
- Reminder削除機能とStudyLog不変性の両方の設計意図を、アプリ層のコードを変えずに両立できた。
- 例外条件が「変更されたカラムの集合」で明示的に書かれているため、将来第三のカラムをこっそり書き換えるバグが混入してもトリガーが検知して拒否する。

### Negative / Trade-offs
- トリガー関数の条件式に将来カラムが増えるたびに追随が必要になる（例: `StudyLog`に新規カラムを追加した場合、この不変チェックのANDリストにも追加しないと、新カラムはチェックされずに素通りしてしまう）。カラム追加時のレビュー観点として申し送りが必要。
- `StudyLog.subjectId`（`Subject`への`onDelete: SetNull`参照）にも同種の潜在バグが存在することが今回の調査で判明済みだが、現時点で`DeleteSubjectUseCase`が存在しないため未顕在化であり、今回のスコープには含めていない。Subject削除機能を実装する際に、同じ設計判断（今回の例外パターンをsubjectId版として追加するか等）を改めて行う必要がある。
