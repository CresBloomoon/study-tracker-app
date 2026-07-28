// backend/src/usecases/CreateReminderUseCase.js
const { ApiError } = require("../domain/errors");
const { ReminderRepository } = require("../repositories/ReminderRepository");
const { SubjectTaskRepository } = require("../repositories/SubjectTaskRepository");

class CreateReminderUseCase {
  constructor(prisma) {
    this.repo = new ReminderRepository(prisma);
    this.subjectTaskRepo = new SubjectTaskRepository(prisma);
  }

  async execute({ title, dueAt, subjectTaskId }) {
    if (typeof title !== "string" || title.trim().length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "title is required");
    }

    if (typeof dueAt !== "string" || dueAt.trim().length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "dueAt is required");
    }

    const dueAtDate = new Date(dueAt);
    if (Number.isNaN(dueAtDate.getTime())) {
      throw new ApiError(400, "VALIDATION_ERROR", "dueAt must be ISO8601 string");
    }

    if (subjectTaskId) {
      const subjectTaskExists = await this.subjectTaskRepo.existsById(subjectTaskId);
      if (!subjectTaskExists) throw new ApiError(404, "SUBJECT_TASK_NOT_FOUND", "subjectTaskId not found");
    }

    // DB制約に合わせて軽く丸め（任意だけど安全）
    const normalizedTitle = title.trim().slice(0, 200);

    const created = await this.repo.create({
      title: normalizedTitle,
      dueAt: dueAtDate,
      subjectTaskId: subjectTaskId ?? null,
    });

    return {
      ...created,
      dueAt: created.dueAt.toISOString(),
      doneAt: created.doneAt ? created.doneAt.toISOString() : null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }
}

module.exports = { CreateReminderUseCase };
