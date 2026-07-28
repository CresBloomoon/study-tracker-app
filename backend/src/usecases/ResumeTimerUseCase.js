const { TimerSessionRepository } = require("../repositories/TimerSessionRepository");

/**
 * ResumeTimerUseCase
 *
 * 役割：
 * - STOPPED（一時停止）中のタイマーを再開する
 * - StudyLog は絶対に作らない（ADR-013）
 *
 * 重要：
 * - 現行スキーマでは「一時停止中の時間」を別フィールドで持たないため、
 *   再開時に startedAt を調整して「停止していた時間を elapsed に含めない」ようにする。
 *   つまり、elapsedSec = now - startedAt が、停止前の elapsed に一致するよう補正する。
 */
class ResumeTimerUseCase {
  constructor(prisma) {
    this.prisma = prisma;
    this.timerSessionRepo = new TimerSessionRepository(prisma);
  }

  /**
   * @param {Object} params
   * @param {string} params.clientRequestId
   */
  async execute({ clientRequestId }) {
    // clientRequestId は後方互換のため受け取るが、
    // Resume では冪等管理には使わない（現状の設計）
    void clientRequestId;

    // 最新の未記録セッション（RUNNING/STOPPED）を取る
    const latest = await this.timerSessionRepo.findLatestUnrecorded();

    if (!latest) {
      return { status: "NO_SESSION_TO_RESUME" };
    }

    if (latest.state !== "PAUSED") {
      return {
        status: "RESUME_NOT_ALLOWED",
        reason: "REQUIRES_PAUSED",
        currentState: latest.state,
        sessionId: latest.id,
      };
    }

    const now = new Date();
    const startedAt = new Date(latest.startedAt);
    const endedAt = latest.endedAt ? new Date(latest.endedAt) : now;

    // 停止直前までの経過秒
    const elapsedSec = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

    // 再開後の elapsedSec が elapsedSec に一致するよう startedAt を補正する
    const newStartedAt = new Date(now.getTime() - elapsedSec * 1000);

    const updatedCount = await this.timerSessionRepo.resumePausedById(latest.id, newStartedAt);

    if (updatedCount === 0) {
      // レースで誰かが先に再開/記録した等
      const reloaded = await this.prisma.timerSession.findUnique({ where: { id: latest.id } });
      return {
        status: "ALREADY_RESUMED",
        sessionId: latest.id,
        state: reloaded?.state ?? latest.state,
      };
    }

    return {
      status: "RUNNING",
      sessionId: latest.id,
      startedAt: newStartedAt,
    };
  }
}

module.exports = { ResumeTimerUseCase };
