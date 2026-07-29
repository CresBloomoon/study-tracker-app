// backend/src/usecases/GetMonthlyStudyTrendUseCase.js
const { StudyLogRepository } = require("../repositories/StudyLogRepository");
const { roundUpMinutes, toJstMonthKey } = require("../domain/time");

function nextMonthKey(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  return `${nextY}-${String(nextM).padStart(2, "0")}`;
}

class GetMonthlyStudyTrendUseCase {
  constructor(prisma) {
    this.studyLogRepo = new StudyLogRepository(prisma);
  }

  // 記録の最初の月から現在の月まで、月次の合計学習時間を欠損なく並べる
  async execute({ now = new Date() } = {}) {
    const logs = await this.studyLogRepo.findAllStartedAtAndDuration();
    if (logs.length === 0) return { items: [] };

    const minutesByMonth = new Map();
    for (const l of logs) {
      const key = toJstMonthKey(l.startedAt);
      minutesByMonth.set(key, (minutesByMonth.get(key) ?? 0) + roundUpMinutes(l.durationSec));
    }

    const firstMonth = toJstMonthKey(logs[0].startedAt);
    const lastMonth = toJstMonthKey(now);

    const items = [];
    let cursor = firstMonth;
    while (true) {
      items.push({ month: cursor, minutes: minutesByMonth.get(cursor) ?? 0 });
      if (cursor === lastMonth) break;
      cursor = nextMonthKey(cursor);
    }

    return { items };
  }
}

module.exports = { GetMonthlyStudyTrendUseCase };
