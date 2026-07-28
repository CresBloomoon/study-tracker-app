// backend/src/repositories/TimerSessionRepository.js

class TimerSessionRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findRunning() {
    return this.prisma.timerSession.findFirst({
      where: { state: "RUNNING" },
      orderBy: { startedAt: "desc" },
    });
  }

  async findByClientRequestId(clientRequestId) {
    if (!clientRequestId) return null;
    return this.prisma.timerSession.findUnique({
      where: { clientRequestId },
    });
  }

  async start({
    id,
    subjectId,
    startedAt,
    clientRequestId,
    mode,
    configJson,
    phase,
    setIndex,
    totalSets,
    phaseStartedAt,
    phaseEndsAt,
    awaitingAfterPhase,
  }) {
    return this.prisma.timerSession.create({
      data: {
        id,
        subjectId,
        startedAt,
        clientRequestId,
        state: "RUNNING",
        mode,
        configJson,
        phase,
        setIndex,
        totalSets,
        phaseStartedAt,
        phaseEndsAt,
        awaitingAfterPhase,
      },
    });
  }

  // Record 用：最新の「未記録」セッションを取る（RUNNING/PAUSEDどちらでも）
  async findLatestUnrecorded() {
    return this.prisma.timerSession.findFirst({
      where: { recordedAt: null },
      orderBy: { startedAt: "desc" },
    });
  }

  async stopRunningById({ id, endedAt, durationSec, roundedMinutes }) {
    return this.prisma.timerSession.update({
      where: { id },
      data: {
        state: "PAUSED",
        endedAt,
        durationSec,
        roundedMinutes,
      },
    });
  }

  async markRecorded({ id, recordedAt, studyLogId }) {
    return this.prisma.timerSession.update({
      where: { id },
      data: {
        recordedAt,
        studyLogId,
      },
    });
  }

  async updateById({ id, data }) {
    return this.prisma.timerSession.update({
      where: { id },
      data,
    });
  }

  async pauseRunningById({ id, endedAt, durationSec, roundedMinutes, clientRequestId }) {
    return this.updateById(id, {
      state: "PAUSED",
      endedAt,
      durationSec,
      roundedMinutes,
      clientRequestId: clientRequestId ?? null,
    });
  }

  async resumePausedById(id, newStartedAt) {
    return this.updateById(id, {
      state: "RUNNING",
      startedAt: newStartedAt,
      endedAt: null,
      durationSec: null,
      roundedMinutes: null,
    });
  }
}

module.exports = { TimerSessionRepository };
