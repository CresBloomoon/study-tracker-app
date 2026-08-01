// backend/src/usecases/DeleteReminderUseCase.js
const { ApiError } = require("../domain/errors");
const { ReminderRepository } = require("../repositories/ReminderRepository");

class DeleteReminderUseCase {
  constructor(prisma) {
    this.repo = new ReminderRepository(prisma);
  }

  async execute({ id }) {
    const exists = await this.repo.existsById(id);
    if (!exists) throw new ApiError(404, "REMINDER_NOT_FOUND", "reminder not found");

    await this.repo.deleteById(id);
  }
}

module.exports = { DeleteReminderUseCase };
