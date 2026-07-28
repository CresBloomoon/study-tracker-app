// backend/src/usecases/GetMilestoneUseCase.js
const { formatPlainDate } = require("../domain/time");
const { MilestoneRepository } = require("../repositories/MilestoneRepository");

class GetMilestoneUseCase {
  constructor(prisma) {
    this.repo = new MilestoneRepository(prisma);
  }

  async execute({ id }) {
    const milestone = await this.repo.findByIdWithSubjectTasks(id);
    if (!milestone) return null;

    return {
      id: milestone.id,
      name: milestone.name,
      deadlineDate: formatPlainDate(milestone.deadlineDate),
      createdAt: milestone.createdAt.toISOString(),
      subjectTasks: milestone.subjectTasks.map((t) => ({
        id: t.id,
        subjectId: t.subjectId,
        startDate: formatPlainDate(t.startDate),
        endDate: formatPlainDate(t.endDate),
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }
}

module.exports = { GetMilestoneUseCase };
