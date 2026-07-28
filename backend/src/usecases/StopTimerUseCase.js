// backend/src/usecases/StopTimerUseCase.js
const { roundUpMinutes } = require("../domain/time");

class StopTimerUseCase {
  constructor({ timerSessionRepo, studyLogRepo }) {
    this.timerSessionRepo = timerSessionRepo;
    this.studyLogRepo = studyLogRepo;
  }

  /**
   * Stop = PAUSE（記録は作らない）
   * - RUNNING -> PAUSED
   * - PAUSED/IDLE のときは 409 相当の結果を返す（routes側でそのまま返してOK）
   * - clientRequestId が既に処理済みなら冪等に同じ結果を返す
   */
  async execute({ clientRequestId, now = new Date() }) {
    // 冪等性：同じ clientRequestId が既に使われていたらその結果を返す
    if (clientRequestId) {
      const already = await this.timerSessionRepo.findByClientRequestId(clientRequestId);
      if (already) {
        // 既に停止済み/記録済みなど状態はあるが、Stopの返却形式に寄せる
        const endedAt = already.endedAt ?? now;
        const durationSec = Math.max(0, Math.floor((endedAt.getTime() - already.startedAt.getTime()) / 1000));
        return {
          status: already.state, // RUNNING / PAUSED
          sessionId: already.id,
          startedAt: already.startedAt,
          endedAt: endedAt,
          durationSec,
          roundedMinutes: roundUpMinutes(durationSec),
          studyLogId: already.studyLogId ?? null,
          idempotent: true,
        };
      }
    }

    const latest = await this.timerSessionRepo.findLatestUnrecorded();
    if (!latest) {
      return { status: "STOP_NOT_ALLOWED", reason: "REQUIRES_RUNNING", currentState: "IDLE" };
    }

    if (latest.state !== "RUNNING") {
      return {
        status: "STOP_NOT_ALLOWED",
        reason: "REQUIRES_RUNNING",
        currentState: latest.state,
        sessionId: latest.id,
      };
    }

    const endedAt = now;
    const durationSec = Math.max(0, Math.floor((endedAt.getTime() - latest.startedAt.getTime()) / 1000));
    const roundedMinutes = roundUpMinutes(durationSec);

    const paused = await this.timerSessionRepo.pauseRunningById({
      id: latest.id,
      endedAt,
      durationSec,
      roundedMinutes,
      clientRequestId: clientRequestId ?? null,
    });

    return {
      status: "PAUSED",
      sessionId: paused.id,
      startedAt: paused.startedAt,
      endedAt: paused.endedAt,
      durationSec: paused.durationSec,
      roundedMinutes: paused.roundedMinutes,
      studyLogId: paused.studyLogId ?? null,
    };
  }
}

module.exports = { StopTimerUseCase };
