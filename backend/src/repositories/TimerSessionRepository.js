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

  // studyLogIdはTimerSessionの列ではない（StudyLog側からのリンクを持たない設計）
  async markRecorded({ id, recordedAt }) {
    return this.prisma.timerSession.update({
      where: { id },
      data: {
        recordedAt,
      },
    });
  }

  async updateById({ id, data }) {
    return this.prisma.timerSession.update({
      where: { id },
      data,
    });
  }

  // durationSec/roundedMinutesはTimerSessionの列ではない（都度startedAt/endedAtから計算する値のため持たない）
  async pauseRunningById({ id, endedAt, clientRequestId }) {
    return this.updateById({
      id,
      data: {
        state: "PAUSED",
        endedAt,
        clientRequestId: clientRequestId ?? null,
      },
    });
  }

  async resumePausedById(id, newStartedAt) {
    return this.updateById({
      id,
      data: {
        state: "RUNNING",
        startedAt: newStartedAt,
        endedAt: null,
      },
    });
  }
}

module.exports = { TimerSessionRepository };
