// backend/src/usecases/GetReminderSummaryUseCase.js
const { ReminderRepository } = require("../repositories/ReminderRepository");
const { getJstTodayRange, toJstDateKey } = require("../domain/time");

class GetReminderSummaryUseCase {
  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new ReminderRepository(prisma);
  }

  async execute() {
    const now = new Date();
    const todayJst = toJstDateKey(now);
    const { startUtc, endUtc } = getJstTodayRange(now);

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
