const { ApiError } = require("../domain/errors");
const { ReminderRepository } = require("../repositories/ReminderRepository");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class MarkReminderUndoneUseCase {
  constructor(prisma) {
    this.repo = new ReminderRepository(prisma);
  }

  async execute({ id }) {
    if (!UUID_RE.test(id)) {
      throw new ApiError(400, "VALIDATION_ERROR", "id must be UUID");
    }

    const exists = await this.repo.existsById(id);
    if (!exists) {
      throw new ApiError(404, "NOT_FOUND", "Reminder not found");
    }

    const updated = await this.repo.markUndone(id);
    return {
      ...updated,
      dueAt: updated.dueAt.toISOString(),
      doneAt: updated.doneAt ? updated.doneAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}

module.exports = { MarkReminderUndoneUseCase };
