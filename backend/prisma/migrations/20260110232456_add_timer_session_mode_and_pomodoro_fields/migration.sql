-- CreateEnum
CREATE TYPE "TimerMode" AS ENUM ('STOPWATCH', 'POMODORO');

-- CreateEnum
CREATE TYPE "PomodoroPhase" AS ENUM ('FOCUS', 'BREAK');

-- AlterTable
ALTER TABLE "TimerSession" ADD COLUMN     "configJson" JSONB,
ADD COLUMN     "mode" "TimerMode",
ADD COLUMN     "phase" "PomodoroPhase",
ADD COLUMN     "setIndex" INTEGER,
ADD COLUMN     "totalSets" INTEGER;

-- CreateIndex
CREATE INDEX "TimerSession_mode_idx" ON "TimerSession"("mode");

-- CreateIndex
CREATE INDEX "TimerSession_phase_idx" ON "TimerSession"("phase");
