// backend/src/usecases/GetReminderSummaryUseCase.js
const { ReminderRepository } = require("../repositories/ReminderRepository");

// JSTの今日(YYYY-MM-DD)
function getTodayJstYyyyMmDd(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

// JST日付(YYYY-MM-DD) -> UTCの [start, end)
function jstDateToUtcRange(dateStr) {
  const startUtc = new Date(`${dateStr}T00:00:00+09:00`);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}

class GetReminderSummaryUseCase {
  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new ReminderRepository(prisma);
  }

  async execute() {
    const todayJst = getTodayJstYyyyMmDd(new Date());
    const { startUtc, endUtc } = jstDateToUtcRange(todayJst);

    const [dueTodayOpenCount, openCount, doneCount] = await Promise.all([
      this.repo.countDueTodayOpen({ startUtc, endUtc }),
      this.repo.countOpen(),
      this.repo.countDone(),
    ]);

    return {
      dueTodayOpenCount,
      openCount,
      doneCount,
      ranges: {
        todayJst,
        todayStartUtc: startUtc.toISOString(),
        todayEndUtc: endUtc.toISOString(),
      },
    };
  }
}

module.exports = { GetReminderSummaryUseCase };
