// backend/src/repositories/StudyLogRepository.js
const { jstDateToUtcRange } = require("../domain/time");

/**
 * Dateガード（Prismaに Invalid Date を投げないため）
 */
function assertValidDate(d, name) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    throw new Error(`INVALID_DATE: ${name} is invalid (${d})`);
  }
}

class StudyLogRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create({ subjectId, startedAt, endedAt, durationSec, clientRequestId, note, linkedReminderId }) {
    return this.prisma.studyLog.create({
      data: { subjectId, startedAt, endedAt, durationSec, clientRequestId, note, linkedReminderId },
    });
  }

  /**
   * JST日付でログ取得（v1は startedAt 基準でその日判定）
   */
  async findByDateJst(dateStr) {
    const { startUtc, endUtc } = jstDateToUtcRange(dateStr);

    assertValidDate(startUtc, "startUtc");
    assertValidDate(endUtc, "endUtc");

    return this.prisma.studyLog.findMany({
      where: {
        startedAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      orderBy: { startedAt: "asc" },
      select: {
        id: true,
        subjectId: true,
        startedAt: true,
        endedAt: true,
        durationSec: true,
        note: true,
        linkedReminderId: true,
      },
    });
  }

  async sumDurationSecByStartedAtRange({ startUtc, endUtc }) {
    assertValidDate(startUtc, "startUtc");
    assertValidDate(endUtc, "endUtc");

    const result = await this.prisma.studyLog.aggregate({
      where: {
        startedAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      _sum: { durationSec: true },
    });

    return result._sum.durationSec ?? 0;
  }

  async findByClientRequestId(clientRequestId) {
    return this.prisma.studyLog.findUnique({
      where: { clientRequestId },
      select: {
        id: true,
        subjectId: true,
        startedAt: true,
        endedAt: true,
        durationSec: true,
        clientRequestId: true,
      },
    });
  }

  async sumRoundedMinutesFrom(fromDate) {
    assertValidDate(fromDate, "fromDate");

    const logs = await this.prisma.studyLog.findMany({
      where: { startedAt: { gte: fromDate } },
      select: { durationSec: true },
    });

    let sum = 0;
    for (const l of logs) {
      const sec = Math.max(0, l.durationSec ?? 0);
      sum += Math.ceil(sec / 60);
    }
    return sum;
  }

  /**
   * 日別（JST）に切り上げ分を集計
   * @returns Map<YYYY-MM-DD, minutes>
   */
  async sumRoundedMinutesByDay(fromDate, toDateExclusive) {
    assertValidDate(fromDate, "fromDate");
    assertValidDate(toDateExclusive, "toDateExclusive");

    const logs = await this.prisma.studyLog.findMany({
      where: {
        startedAt: {
          gte: fromDate,
          lt: toDateExclusive,
        },
      },
      select: {
        startedAt: true,
        durationSec: true,
      },
    });

    const map = new Map();
    for (const l of logs) {
      const jst = new Date(l.startedAt.getTime() + 9 * 60 * 60 * 1000);
      const key = jst.toISOString().slice(0, 10);
      const sec = Math.max(0, l.durationSec ?? 0);
      const min = Math.ceil(sec / 60);
      map.set(key, (map.get(key) ?? 0) + min);
    }

    return map;
  }

  async sumRoundedMinutesInRange(fromDate, toDateExclusive) {
    assertValidDate(fromDate, "fromDate");
    assertValidDate(toDateExclusive, "toDateExclusive");

    const logs = await this.prisma.studyLog.findMany({
      where: {
        startedAt: {
          gte: fromDate,
          lt: toDateExclusive,
        },
      },
      select: { durationSec: true },
    });

    let sum = 0;
    for (const l of logs) {
      const sec = Math.max(0, l.durationSec ?? 0);
      sum += Math.ceil(sec / 60);
    }
    return sum;
  }

  async sumRoundedMinutesBySubjectInRange(fromDate, toDateExclusive) {
    assertValidDate(fromDate, "fromDate");
    assertValidDate(toDateExclusive, "toDateExclusive");

    const logs = await this.prisma.studyLog.findMany({
      where: {
        startedAt: {
          gte: fromDate,
          lt: toDateExclusive,
        },
      },
      select: {
        subjectId: true,
        durationSec: true,
      },
    });

    const map = new Map(); // subjectId -> minutes
    for (const l of logs) {
      const id = l.subjectId ?? "UNASSIGNED";
      const sec = Math.max(0, l.durationSec ?? 0);
      const min = Math.ceil(sec / 60);
      map.set(id, (map.get(id) ?? 0) + min);
    }
    return map;
  }
}

module.exports = { StudyLogRepository };
