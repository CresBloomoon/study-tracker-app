// backend/src/usecases/RecordTimerUseCase.js
const { roundUpMinutes } = require("../domain/time");

class RecordTimerUseCase {
  constructor({ timerSessionRepo, studyLogRepo }) {
    this.timerSessionRepo = timerSessionRepo;
    this.studyLogRepo = studyLogRepo;
  }

  /**
   * Record = StudyLog生成 + セッションを recordedAt で確定
   * - PAUSED のときだけ許可（UI仕様どおり）
   * - 冪等性：clientRequestId が既に StudyLog に使われていたら同じ結果を返す
   */
  async execute({ clientRequestId, note = null, now = new Date() }) {
    if (!clientRequestId) {
      return { status: "RECORD_NOT_ALLOWED", reason: "MISSING_CLIENT_REQUEST_ID" };
    }

    // 冪等性：StudyLog側で先に見て、存在すればそれを返す
    const existingLog = await this.studyLogRepo.findByClientRequestId(clientRequestId);
    if (existingLog) {
      return {
        status: "RECORDED",
        idempotent: true,
        sessionId: existingLog.timerSessionId ?? null,
        studyLogId: existingLog.id,
        startedAt: existingLog.startedAt,
        endedAt: existingLog.endedAt,
        durationSec: existingLog.durationSec,
        roundedMinutes: roundUpMinutes(existingLog.durationSec),
      };
    }

    const latest = await this.timerSessionRepo.findLatestUnrecorded();
    if (!latest) {
      return { status: "RECORD_NOT_ALLOWED", reason: "REQUIRES_PAUSED", currentState: "IDLE" };
    }

    if (latest.state !== "PAUSED") {
      return {
        status: "RECORD_NOT_ALLOWED",
        reason: "REQUIRES_PAUSED",
        currentState: latest.state,
        sessionId: latest.id,
      };
    }

    // endedAt は Stop で固定済みのはず（無ければ now で補完）
    const endedAt = latest.endedAt ?? now;
    const durationSec = Math.max(0, Math.floor((endedAt.getTime() - latest.startedAt.getTime()) / 1000));
    const roundedMinutes = roundUpMinutes(durationSec);

    const created = await this.studyLogRepo.createFromTimerSession({
      clientRequestId,
      subjectId: latest.subjectId,
      startedAt: latest.startedAt,
      endedAt,
      durationSec,
      note,
      timerSessionId: latest.id,
    });

    await this.timerSessionRepo.markRecorded({
      id: latest.id,
      recordedAt: now,
      studyLogId: created.id,
    });

    return {
      status: "RECORDED",
      sessionId: latest.id,
      studyLogId: created.id,
      startedAt: latest.startedAt,
      endedAt,
      durationSec,
      roundedMinutes,
    };
  }
}

module.exports = { RecordTimerUseCase };
