-- Enable UUID generator
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure UUID defaults
ALTER TABLE "Subject"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "StudyLog"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "TimerSession"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
