const { ApiError } = require("../domain/errors");
const { ReminderRepository } = require("../repositories/ReminderRepository");

class ListRemindersUseCase {
  constructor(prisma) {
    this.repo = new ReminderRepository(prisma);
  }

  async execute({ status }) {
    const s = status ?? "open";
    if (!["open", "done", "all"].includes(s)) {
      throw new ApiError(400, "VALIDATION_ERROR", "status must be open|done|all");
    }

    const items = await this.repo.findMany({ status: s });

    return items.map((r) => ({
      ...r,
      dueAt: r.dueAt.toISOString(),
      doneAt: r.doneAt ? r.doneAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }
}

module.exports = { ListRemindersUseCase };
