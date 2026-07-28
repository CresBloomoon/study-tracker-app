// backend/src/usecases/CreateMilestoneUseCase.js
const { parsePlainDate, formatPlainDate } = require("../domain/time");
const { MilestoneRepository } = require("../repositories/MilestoneRepository");

class CreateMilestoneUseCase {
  constructor(prisma) {
    this.repo = new MilestoneRepository(prisma);
  }

  async execute({ name, deadlineDate }) {
    const created = await this.repo.create({
      name,
      deadlineDate: parsePlainDate(deadlineDate),
    });

    return {
      id: created.id,
      name: created.name,
      deadlineDate: formatPlainDate(created.deadlineDate),
      createdAt: created.createdAt.toISOString(),
    };
  }
}

module.exports = { CreateMilestoneUseCase };
