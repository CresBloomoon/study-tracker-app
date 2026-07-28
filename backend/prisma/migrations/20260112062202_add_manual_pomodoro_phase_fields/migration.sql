/*
  Warnings:

  - The `clientRequestId` column on the `TimerSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PomodoroAwaitingAfterPhase" AS ENUM ('FOCUS', 'BREAK');

-- AlterEnum
ALTER TYPE "PomodoroPhase" ADD VALUE 'DONE';

-- AlterTable
ALTER TABLE "TimerSession" ADD COLUMN     "awaitingAfterPhase" "PomodoroAwaitingAfterPhase",
ADD COLUMN     "phaseEndsAt" TIMESTAMP(3),
ADD COLUMN     "phaseStartedAt" TIMESTAMP(3),
DROP COLUMN "clientRequestId",
ADD COLUMN     "clientRequestId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "TimerSession_clientRequestId_key" ON "TimerSession"("clientRequestId");
