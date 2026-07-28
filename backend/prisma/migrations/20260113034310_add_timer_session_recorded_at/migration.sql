/*
  Warnings:

  - You are about to drop the column `isDone` on the `Reminder` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudyLog" DROP CONSTRAINT "StudyLog_subjectId_fkey";

-- DropIndex
DROP INDEX "Reminder_isDone_idx";

-- DropIndex
DROP INDEX "Subject_name_key";

-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "isDone";

-- AlterTable
ALTER TABLE "StudyLog" ADD COLUMN     "note" VARCHAR(1000);

-- AlterTable
ALTER TABLE "TimerSession" ADD COLUMN     "recordedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Reminder_doneAt_idx" ON "Reminder"("doneAt");

-- CreateIndex
CREATE INDEX "StudyLog_createdAt_idx" ON "StudyLog"("createdAt");

-- CreateIndex
CREATE INDEX "Subject_isArchived_idx" ON "Subject"("isArchived");

-- CreateIndex
CREATE INDEX "TimerAdvanceRequest_createdAt_idx" ON "TimerAdvanceRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "StudyLog" ADD CONSTRAINT "StudyLog_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
