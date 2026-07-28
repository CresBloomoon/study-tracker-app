const { StudyLogRepository } = require("../repositories/StudyLogRepository");
const { SubjectRepository } = require("../repositories/SubjectRepository");
const { toJstDateKey, startOfJstDay, startOfJstWeek } = require("../domain/time");
const { defaultWeekStartsOn, defaultWeeklyMode } = require("../config/userDefaults");

class GetDashboardSummaryUseCase {
  constructor(prisma) {
    this.studyLogRepo = new StudyLogRepository(prisma);
    this.subjectRepo = new SubjectRepository(prisma);
  }

  async execute({ now = new Date(), weekStartsOn, weeklyMode } = {}) {
    const mode = weeklyMode ?? defaultWeeklyMode();
    const startsOn = weekStartsOn ?? defaultWeekStartsOn();

    const todayStart = startOfJstDay(now);

    // 週の範囲（デフォルトは CALENDAR_WEEK: 月〜日）
    let from, toExclusive;
    if (mode === "LAST_7_DAYS") {
      from = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
      toExclusive = new Date(todayStart.getTime() + 1 * 24 * 60 * 60 * 1000);
    } else {
      from = startOfJstWeek(now, { weekStartsOn: startsOn });
      toExclusive = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const [todayMinutes, weekMinutes, bySubjectMap] = await Promise.all([
      this.studyLogRepo.sumRoundedMinutesFrom(todayStart),
      this.studyLogRepo.sumRoundedMinutesInRange(from, toExclusive),
      this.studyLogRepo.sumRoundedMinutesBySubjectInRange(from, toExclusive),
    ]);

    // subjectId -> name/color 付与（UNASSIGNED は “未分類” として扱う）
    const subjectIds = Array.from(bySubjectMap.keys()).filter((id) => id !== "UNASSIGNED");
    const subjects = await this.subjectRepo.findByIds(subjectIds);
    const subjectMeta = new Map(subjects.map((s) => [s.id, s]));

    const bySubject = Array.from(bySubjectMap.entries())
      .map(([subjectId, minutes]) => {
        if (subjectId === "UNASSIGNED") {
          return { subjectId: null, subjectName: "未分類", colorHex: "#6b7280", minutes };
        }
        const meta = subjectMeta.get(subjectId);
        return {
          subjectId,
          subjectName: meta?.name ?? "（不明）",
          colorHex: meta?.colorHex ?? "#6b7280",
          minutes,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);

    return {
      todayMinutes,
      weekMinutes,
      weekPeriod: {
        mode,
        weekStartsOn: startsOn,
        fromDate: toJstDateKey(from),
        toDate: toJstDateKey(new Date(toExclusive.getTime() - 1)), // inclusive 表示
      },
      bySubject,
    };
  }
}

module.exports = { GetDashboardSummaryUseCase };
