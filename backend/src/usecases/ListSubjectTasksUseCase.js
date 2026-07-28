// backend/src/usecases/ListSubjectTasksUseCase.js
const { formatPlainDate } = require("../domain/time");
const { SubjectTaskRepository } = require("../repositories/SubjectTaskRepository");

class ListSubjectTasksUseCase {
  constructor(prisma) {
    this.repo = new SubjectTaskRepository(prisma);
  }

  async execute({ milestoneId }) {
    const items = await this.repo.findByMilestoneId(milestoneId);

    return items.map((t) => ({
      id: t.id,
      milestoneId: t.milestoneId,
      subjectId: t.subjectId,
      startDate: formatPlainDate(t.startDate),
      endDate: formatPlainDate(t.endDate),
      createdAt: t.createdAt.toISOString(),
    }));
  }
}

module.exports = { ListSubjectTasksUseCase };
