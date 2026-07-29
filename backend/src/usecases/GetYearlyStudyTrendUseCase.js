// backend/src/usecases/GetYearlyStudyTrendUseCase.js
const { StudyLogRepository } = require("../repositories/StudyLogRepository");
const { roundUpMinutes, toJstYearKey } = require("../domain/time");

class GetYearlyStudyTrendUseCase {
  constructor(prisma) {
    this.studyLogRepo = new StudyLogRepository(prisma);
  }

  // 記録の最初の年から現在の年まで、年次の合計学習時間を欠損なく並べる
  async execute({ now = new Date() } = {}) {
    const logs = await this.studyLogRepo.findAllStartedAtAndDuration();
    if (logs.length === 0) return { items: [] };

    const minutesByYear = new Map();
    for (const l of logs) {
      const key = toJstYearKey(l.startedAt);
      minutesByYear.set(key, (minutesByYear.get(key) ?? 0) + roundUpMinutes(l.durationSec));
    }

    const firstYear = Number(toJstYearKey(logs[0].startedAt));
    const lastYear = Number(toJstYearKey(now));

    const items = [];
    for (let y = firstYear; y <= lastYear; y++) {
      const key = String(y);
      items.push({ year: key, minutes: minutesByYear.get(key) ?? 0 });
    }

    return { items };
  }
}

module.exports = { GetYearlyStudyTrendUseCase };
