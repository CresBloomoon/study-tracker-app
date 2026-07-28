const { ApiError } = require("../domain/errors");
const { SubjectRepository } = require("../repositories/SubjectRepository");
const { StudyLogRepository } = require("../repositories/StudyLogRepository");
const { ReminderRepository } = require("../repositories/ReminderRepository");

class CreateStudyLogUseCase {
  constructor(prisma) {
    this.subjectRepo = new SubjectRepository(prisma);
    this.studyLogRepo = new StudyLogRepository(prisma);
    this.reminderRepo = new ReminderRepository(prisma);
  }

  async execute({ subjectId, durationSec, date, clientRequestId, note, linkedReminderId }) {
    const exists = await this.subjectRepo.existsById(subjectId);
    if (!exists) throw new ApiError(404, "SUBJECT_NOT_FOUND", "subjectId not found");

    if (linkedReminderId) {
      const reminderExists = await this.reminderRepo.existsById(linkedReminderId);
      if (!reminderExists) throw new ApiError(404, "REMINDER_NOT_FOUND", "linkedReminderId not found");
    }

    const endedAt = date
      ? new Date(`${date}T14:59:59.000Z`) // 23:59:59 JST = 14:59:59 UTC
      : new Date();
    const startedAt = new Date(endedAt.getTime() - durationSec * 1000);

    // TODO: clientRequestId 冪等（DB側uniqueがあるなら catch して既存返すに進化）
    const created = await this.studyLogRepo.create({
      subjectId,
      startedAt,
      endedAt,
      durationSec,
      clientRequestId,
      note,
      linkedReminderId,
    });

    return {
      id: created.id,
      subjectId: created.subjectId,
      startedAt: created.startedAt,
      endedAt: created.endedAt,
      durationSec: created.durationSec,
      note: created.note,
      linkedReminderId: created.linkedReminderId,
      studyDateJst: created.studyDateJst,
    };
  }
}

module.exports = { CreateStudyLogUseCase };
