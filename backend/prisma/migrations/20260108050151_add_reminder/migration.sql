/*
  Warnings:

  - You are about to drop the column `study_date_jst` on the `StudyLog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ix_studylog_study_date_jst";

-- AlterTable
ALTER TABLE "StudyLog" DROP COLUMN "study_date_jst",
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TimerSession" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Reminder" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reminder_isDone_idx" ON "Reminder"("isDone");

-- CreateIndex
CREATE INDEX "Reminder_dueAt_idx" ON "Reminder"("dueAt");
