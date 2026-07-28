// backend/src/repositories/MilestoneRepository.js
class MilestoneRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create({ name, deadlineDate }) {
    return this.prisma.milestone.create({
      data: { name, deadlineDate },
      select: { id: true, name: true, deadlineDate: true, createdAt: true },
    });
  }

  async existsById(id) {
    const found = await this.prisma.milestone.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!found;
  }

  async findAllSorted() {
    return this.prisma.milestone.findMany({
      orderBy: [{ deadlineDate: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, deadlineDate: true, createdAt: true },
    });
  }

  async findByIdWithSubjectTasks(id) {
    return this.prisma.milestone.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        deadlineDate: true,
        createdAt: true,
        subjectTasks: {
          orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            subjectId: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          },
        },
      },
    });
  }
}

module.exports = { MilestoneRepository };
