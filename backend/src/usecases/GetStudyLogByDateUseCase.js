const { ApiError } = require("../domain/errors");
const { isYyyyMmDd, roundUpMinutes } = require("../domain/time");
const { StudyLogRepository } = require("../repositories/StudyLogRepository");

class GetStudyLogByDateUseCase {
  constructor(prisma) {
    this.studyLogRepo = new StudyLogRepository(prisma);
  }

  async execute({ date }) {
    if (!isYyyyMmDd(date)) throw new ApiError(400, "VALIDATION_ERROR", "date must be YYYY-MM-DD");

    const items = await this.studyLogRepo.findByDateJst(date);

    const bySubject = new Map();
    let total = 0;

    for (const it of items) {
      const minutes = roundUpMinutes(it.durationSec);
      total += minutes;
      bySubject.set(it.subjectId, (bySubject.get(it.subjectId) || 0) + minutes);
    }

    return {
      date,
      items: items.map((it) => ({
        id: it.id,
        subjectId: it.subjectId,
        startedAt: it.startedAt,
        endedAt: it.endedAt,
        durationSec: it.durationSec,
        note: it.note,
        linkedReminderId: it.linkedReminderId,
      })),
      totalMinutesRoundedUp: total,
      bySubjectMinutesRoundedUp: Array.from(bySubject.entries()).map(([subjectId, minutes]) => ({ subjectId, minutes })),
    };
  }
}

module.exports = { GetStudyLogByDateUseCase };
