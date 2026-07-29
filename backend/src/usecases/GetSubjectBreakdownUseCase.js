// backend/src/usecases/GetSubjectBreakdownUseCase.js
const { StudyLogRepository } = require("../repositories/StudyLogRepository");
const { SubjectRepository } = require("../repositories/SubjectRepository");

class GetSubjectBreakdownUseCase {
  constructor(prisma) {
    this.studyLogRepo = new StudyLogRepository(prisma);
    this.subjectRepo = new SubjectRepository(prisma);
  }

  async execute() {
    const bySubjectMap = await this.studyLogRepo.sumRoundedMinutesBySubjectAllTime();

    // subjectId -> name/color 付与（UNASSIGNED は「未分類」として扱う）
    const subjectIds = Array.from(bySubjectMap.keys()).filter((id) => id !== "UNASSIGNED");
    const subjects = await this.subjectRepo.findByIds(subjectIds);
    const subjectMeta = new Map(subjects.map((s) => [s.id, s]));

    const items = Array.from(bySubjectMap.entries())
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

    return { items };
  }
}

module.exports = { GetSubjectBreakdownUseCase };
