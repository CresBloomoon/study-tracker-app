// backend/src/repositories/SubjectTaskRepository.js
class SubjectTaskRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create({ milestoneId, subjectId, startDate, endDate }) {
    return this.prisma.subjectTask.create({
      data: { milestoneId, subjectId, startDate, endDate },
      select: {
        id: true,
        milestoneId: true,
        subjectId: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });
  }

  async existsById(id) {
    const found = await this.prisma.subjectTask.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!found;
  }

  async findByMilestoneId(milestoneId) {
    return this.prisma.subjectTask.findMany({
      where: { milestoneId },
      orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        milestoneId: true,
        subjectId: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });
  }
}

module.exports = { SubjectTaskRepository };
