-- Restore isDone for backward compatibility
ALTER TABLE "Reminder"
ADD COLUMN "isDone" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Reminder"
SET "isDone" = ("doneAt" IS NOT NULL);

CREATE INDEX "Reminder_isDone_idx" ON "Reminder"("isDone");
