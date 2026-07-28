-- RUNNING セッションは同時に1件だけ許可（Postgres 部分ユニークINDEX）
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_one_running_session"
ON "TimerSession" ((1))
WHERE "state" = 'RUNNING';
