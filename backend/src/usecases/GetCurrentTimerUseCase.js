const { TimerSessionRepository } = require("../repositories/TimerSessionRepository");

/**
 * GetCurrentTimerUseCase
 *
 * 役割：
 * - 現在のタイマー状態を「取得」するだけ
 * - 自動停止・自動StudyLog生成は一切しない（ADR-013）
 *
 * 重要：
 * - 「最後に記録した直後」は UI的には IDLE が自然
 *   → 最新セッションが recordedAt を持っていたら IDLE を返す
 */
class GetCurrentTimerUseCase {
  constructor(prisma) {
    this.prisma = prisma;
    this.timerSessionRepo = new TimerSessionRepository(prisma);
  }

  async execute() {
    // まず「最新セッション」を見る（recordedAt の有無に関係なく）
    const latest = await this.timerSessionRepo.findLatestUnrecorded();

    if (!latest) {
      return { status: "IDLE", running: false, session: null };
    }

    // 最新セッションが「記録済み」なら UIはIDLEにするのが自然
    if (latest.recordedAt) {
      return { status: "IDLE", running: false, session: null };
    }

    // ここから先は「未記録セッション」＝UI的にアクティブ
    const now = new Date();
    const startedAt = new Date(latest.startedAt);

    // RUNNING は now、PAUSED は endedAt（無ければ now）で elapsed を固定
    const endForElapsed =
      latest.state === "PAUSED" ? new Date(latest.endedAt ?? now) : now;

    const elapsedSec = Math.max(
      0,
      Math.floor((endForElapsed.getTime() - startedAt.getTime()) / 1000)
    );

    // ★安全装置（副作用なし）
    const ABANDON_SEC = 18 * 60 * 60;
    const isAbandoned = elapsedSec >= ABANDON_SEC;

    return {
      status: latest.state, // "RUNNING" | "PAUSED"
      running: latest.state === "RUNNING",

      session: {
        id: latest.id,
        subjectId: latest.subjectId,
        startedAt: latest.startedAt,
        endedAt: latest.endedAt ?? null,
        elapsedSec,

        mode: latest.mode,
        phase: latest.phase,
        setIndex: latest.setIndex,
        totalSets: latest.totalSets,

        phaseStartedAt: latest.phaseStartedAt,
        phaseEndsAt: latest.phaseEndsAt,

        awaitingAfterPhase: latest.awaitingAfterPhase,

        // UI判断用
        isAbandoned,
        canRecord: latest.state === "PAUSED",
      },
    };
  }
}

module.exports = { GetCurrentTimerUseCase };
