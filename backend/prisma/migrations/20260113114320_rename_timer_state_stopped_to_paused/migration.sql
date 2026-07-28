-- Rename enum value STOPPED -> PAUSED (PostgreSQL)
ALTER TYPE "TimerState" RENAME VALUE 'STOPPED' TO 'PAUSED';
