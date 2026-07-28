// backend/src/usecases/ListMilestonesUseCase.js
const { formatPlainDate } = require("../domain/time");
const { MilestoneRepository } = require("../repositories/MilestoneRepository");

class ListMilestonesUseCase {
  constructor(prisma) {
    this.repo = new MilestoneRepository(prisma);
  }

  async execute() {
    const items = await this.repo.findAllSorted();

    return items.map((m) => ({
      id: m.id,
      name: m.name,
      deadlineDate: formatPlainDate(m.deadlineDate),
      createdAt: m.createdAt.toISOString(),
    }));
  }
}

module.exports = { ListMilestonesUseCase };
