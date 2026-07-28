-- CreateTable
CREATE TABLE "TimerAdvanceRequest" (
    "id" UUID NOT NULL,
    "clientRequestId" UUID NOT NULL,
    "timerSessionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimerAdvanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimerAdvanceRequest_clientRequestId_key" ON "TimerAdvanceRequest"("clientRequestId");

-- CreateIndex
CREATE INDEX "TimerAdvanceRequest_timerSessionId_idx" ON "TimerAdvanceRequest"("timerSessionId");

-- AddForeignKey
ALTER TABLE "TimerAdvanceRequest" ADD CONSTRAINT "TimerAdvanceRequest_timerSessionId_fkey" FOREIGN KEY ("timerSessionId") REFERENCES "TimerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
