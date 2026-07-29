// backend/src/usecases/RecordTimerUseCase.js
const { ApiError } = require("../domain/errors");
const { roundUpMinutes } = require("../domain/time");
const { TimerSessionRepository } = require("../repositories/TimerSessionRepository");
const { StudyLogRepository } = require("../repositories/StudyLogRepository");
const { ReminderRepository } = require("../repositories/ReminderRepository");

class RecordTimerUseCase {
  constructor(prisma) {
    this.timerSessionRepo = new TimerSessionRepository(prisma);
    this.studyLogRepo = new StudyLogRepository(prisma);
    this.reminderRepo = new ReminderRepository(prisma);
  }

  /**
   * Record = StudyLog生成 + セッションを recordedAt で確定
   * - PAUSED のときだけ許可（UI仕様どおり）
   * - 冪等性：clientRequestId が既に StudyLog に使われていたら同じ結果を返す
   */
  async execute({ clientRequestId, note = null, linkedReminderId = null, now = new Date() }) {
    if (!clientRequestId) {
      return { status: "RECORD_NOT_ALLOWED", reason: "MISSING_CLIENT_REQUEST_ID" };
    }

    // 冪等性：StudyLog側で先に見て、存在すればそれを返す
    // NOTE: StudyLog側にTimerSessionへの逆リンクは持たないため、sessionIdはここでは特定できない
    const existingLog = await this.studyLogRepo.findByClientRequestId(clientRequestId);
    if (existingLog) {
      return {
        status: "RECORDED",
        idempotent: true,
        sessionId: null,
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

    if (linkedReminderId) {
      const reminderExists = await this.reminderRepo.existsById(linkedReminderId);
      if (!reminderExists) throw new ApiError(404, "REMINDER_NOT_FOUND", "linkedReminderId not found");
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
      linkedReminderId,
      timerSessionId: latest.id,
    });

    await this.timerSessionRepo.markRecorded({
      id: latest.id,
      recordedAt: now,
    });

    return {
      status: "RECORDED",
      sessionId: latest.id,
      studyLogId: created.id,
      startedAt: latest.startedAt,
      endedAt,
      durationSec,
      roundedMinutes,
      note: created.note,
      linkedReminderId: created.linkedReminderId,
    };
  }
}

module.exports = { RecordTimerUseCase };
