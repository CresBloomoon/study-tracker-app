-- StudyLog不変トリガーへの例外追加。
-- 背景: Reminder削除時、StudyLog.linkedReminderId（onDelete: SetNull）が
-- NULLに更新されるが、forbid_study_log_mutation()トリガーが無条件にUPDATEを
-- 拒否していたため、紐づくStudyLogが存在するReminderの削除が500エラーになっていた。
-- 詳細な経緯は docs/adr/ADR-018-studylog-immutable-exception-for-reminder-unlink.md を参照。
--
-- linkedReminderIdがNULLに変わり、かつ他の全カラムが不変であるUPDATEのみを例外的に許可する。
-- DELETEは従来通り無条件で拒否する（分岐なし、変更なし）。
CREATE OR REPLACE FUNCTION forbid_study_log_mutation()
RETURNS trigger AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;
