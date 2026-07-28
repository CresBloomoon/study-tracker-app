/*
  Warnings:

  - A unique constraint covering the columns `[clientRequestId]` on the table `TimerSession` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TimerSession" ADD COLUMN     "clientRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TimerSession_clientRequestId_key" ON "TimerSession"("clientRequestId");
