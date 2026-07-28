-- CreateEnum
CREATE TYPE "TimerState" AS ENUM ('RUNNING', 'STOPPED');

-- CreateTable
CREATE TABLE "Subject" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "colorHex" VARCHAR(7) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimerSession" (
    "id" UUID NOT NULL,
    "state" "TimerState" NOT NULL DEFAULT 'RUNNING',
    "subjectId" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyLog" (
    "id" UUID NOT NULL,
    "clientRequestId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "Subject_sortOrder_idx" ON "Subject"("sortOrder");

-- CreateIndex
CREATE INDEX "TimerSession_state_idx" ON "TimerSession"("state");

-- CreateIndex
CREATE INDEX "TimerSession_startedAt_idx" ON "TimerSession"("startedAt");

-- CreateIndex
CREATE INDEX "TimerSession_subjectId_idx" ON "TimerSession"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyLog_clientRequestId_key" ON "StudyLog"("clientRequestId");

-- CreateIndex
CREATE INDEX "StudyLog_startedAt_idx" ON "StudyLog"("startedAt");

-- CreateIndex
CREATE INDEX "StudyLog_subjectId_idx" ON "StudyLog"("subjectId");

-- AddForeignKey
ALTER TABLE "TimerSession"
ADD CONSTRAINT "TimerSession_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyLog"
ADD CONSTRAINT "StudyLog_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

--------------------------------------------------------------------------------
-- ↓↓↓ ここから「手書き追記（DBの魂）」 ↓↓↓
--------------------------------------------------------------------------------

-- StudyLog is immutable (no UPDATE/DELETE)
CREATE OR REPLACE FUNCTION forbid_study_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'StudyLog is immutable: UPDATE/DELETE are forbidden';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_forbid_studylog_update
BEFORE UPDATE ON "StudyLog"
FOR EACH ROW EXECUTE FUNCTION forbid_study_log_mutation();

CREATE TRIGGER trg_forbid_studylog_delete
BEFORE DELETE ON "StudyLog"
FOR EACH ROW EXECUTE FUNCTION forbid_study_log_mutation();

-- Only one RUNNING TimerSession at a time
CREATE UNIQUE INDEX ux_timer_sessions_single_running
ON "TimerSession" ("state")
WHERE "state" = 'RUNNING';

-- generated column for JST date (fixed +09:00; immutable)
ALTER TABLE "StudyLog"
ADD COLUMN study_date_jst date
GENERATED ALWAYS AS (("startedAt" + interval '9 hours')::date) STORED;

CREATE INDEX ix_studylog_study_date_jst
ON "StudyLog" (study_date_jst);