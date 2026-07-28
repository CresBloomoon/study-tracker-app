const { StudyLogRepository } = require("../repositories/StudyLogRepository");
const { startOfJstDay, toJstDateKey, startOfJstWeek } = require("../domain/time");
const { defaultWeekStartsOn, defaultWeeklyMode } = require("../config/userDefaults");

class GetWeeklyStudyUseCase {
  constructor(prisma) {
    this.studyLogRepo = new StudyLogRepository(prisma);
  }

  async execute({ now = new Date(), weekStartsOn, weeklyMode } = {}) {
    const mode = weeklyMode ?? defaultWeeklyMode();
    const startsOn = weekStartsOn ?? defaultWeekStartsOn();

    const todayStart = startOfJstDay(now);

    let from, toExclusive;
    if (mode === "LAST_7_DAYS") {
      from = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
      toExclusive = new Date(todayStart.getTime() + 1 * 24 * 60 * 60 * 1000);
    } else {
      from = startOfJstWeek(now, { weekStartsOn: startsOn });
      toExclusive = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const map = await this.studyLogRepo.sumRoundedMinutesByDay(from, toExclusive);

    const items = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
      const key = toJstDateKey(d);
      items.push({ date: key, minutes: map.get(key) ?? 0 });
    }

    return {
      weekPeriod: {
        mode,
        weekStartsOn: startsOn,
        fromDate: toJstDateKey(from),
        toDate: toJstDateKey(new Date(toExclusive.getTime() - 1)),
      },
      items,
    };
  }
}

module.exports = { GetWeeklyStudyUseCase };
