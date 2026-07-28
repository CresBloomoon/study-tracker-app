// backend/src/usecases/GetWeeklyReportUseCase.js
const { ApiError } = require("../domain/errors");
const { StudyLogRepository } = require("../repositories/StudyLogRepository");
const { SubjectRepository } = require("../repositories/SubjectRepository");
const { defaultWeekStartsOn, defaultWeeklyMode } = require("../config/userDefaults");
const {
  jstDateToUtcRange,
  startOfJstDay,
  addJstDays,
  startOfJstWeek,
  endOfJstWeekExclusive,
  formatJstDateKey,
} = require("../domain/time");

function parseJstDateKeyOrThrow(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new ApiError(400, "INVALID_WEEK", "week must be YYYY-MM-DD");
  }

  // ★ここが今回のバグの芯：
  // jstDateToUtcRange は { startUtc, endUtc } を返す前提で扱う
  const { startUtc } = jstDateToUtcRange(s);

  if (!(startUtc instanceof Date) || Number.isNaN(startUtc.getTime())) {
    throw new ApiError(400, "INVALID_WEEK", "week is invalid date");
  }

  return startUtc;
}

function buildByDayArray(fromDate, toDateExclusive, minutesMap) {
  const days = [];
  for (let d = new Date(fromDate); d < toDateExclusive; d = addJstDays(d, 1)) {
    const key = formatJstDateKey(d);
    days.push({
      date: key,
      minutes: minutesMap.get(key) ?? 0,
    });
  }
  return days;
}

class GetWeeklyReportUseCase {
  constructor(prisma) {
    this.prisma = prisma;
    this.studyLogRepo = new StudyLogRepository(prisma);
    this.subjectRepo = new SubjectRepository(prisma);
  }

  async execute({ week } = {}) {
    const weekStartsOn = defaultWeekStartsOn(); // "MON" | "SUN"
    const mode = defaultWeeklyMode(); // "CALENDAR_WEEK" | "LAST_7_DAYS"

    // 「集計対象の基準日」
    // weekが指定されたらその日（JST日付）の週。無ければ「先週」を返す。
    const baseDate = week ? parseJstDateKeyOrThrow(week) : addJstDays(startOfJstDay(new Date()), -7);

    let fromDate;
    let toDateExclusive;

    if (mode === "LAST_7_DAYS") {
      // 直近7日（今日含む）: 今日の0時(JST)をend側にし、そこから-6日
      const todayStart = startOfJstDay(new Date());
      fromDate = addJstDays(todayStart, -6);
      toDateExclusive = addJstDays(todayStart, 1);
    } else {
      // CALENDAR_WEEK: 週の開始〜7日
      fromDate = startOfJstWeek(baseDate, { weekStartsOn });
      toDateExclusive = endOfJstWeekExclusive(fromDate);
    }

    // ここで死ぬと Prisma が "Invalid Date" って怒るので、先に弾く
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDateExclusive.getTime())) {
      throw new ApiError(500, "INVALID_PERIOD", "computed week period is invalid");
    }

    const totalMinutes = await this.studyLogRepo.sumRoundedMinutesInRange(fromDate, toDateExclusive);

    const minutesByDayMap = await this.studyLogRepo.sumRoundedMinutesByDay(fromDate, toDateExclusive);
    const byDay = buildByDayArray(fromDate, toDateExclusive, minutesByDayMap);

    const minutesBySubjectMap = await this.studyLogRepo.sumRoundedMinutesBySubjectInRange(fromDate, toDateExclusive);

    // subject 名を引く（存在しない/未分類の保険も含む）
    const subjects = await this.subjectRepo.findAllSorted();
    const subjectNameMap = new Map(subjects.map((s) => [s.id, s.name]));

    const bySubject = Array.from(minutesBySubjectMap.entries())
      .map(([subjectId, minutes]) => {
        const name = subjectId === "UNASSIGNED" ? "未分類" : (subjectNameMap.get(subjectId) ?? "未分類");
        return { subjectId, name, minutes };
      })
      .sort((a, b) => b.minutes - a.minutes);

    const fromDateKey = formatJstDateKey(fromDate);
    const toDateKey = formatJstDateKey(addJstDays(toDateExclusive, -1));

    return {
      weekPeriod: {
        mode,
        weekStartsOn,
        fromDate: fromDateKey,
        toDate: toDateKey,
      },
      totalMinutes,
      byDay,
      bySubject,
    };
  }
}

module.exports = { GetWeeklyReportUseCase };
