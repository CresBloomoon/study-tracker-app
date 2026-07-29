// backend/src/usecases/ListSubjectTaskRemindersUseCase.js
const { ApiError } = require("../domain/errors");
const { SubjectTaskRepository } = require("../repositories/SubjectTaskRepository");
const { ReminderRepository } = require("../repositories/ReminderRepository");

class ListSubjectTaskRemindersUseCase {
  constructor(prisma) {
    this.subjectTaskRepo = new SubjectTaskRepository(prisma);
    this.reminderRepo = new ReminderRepository(prisma);
  }

  async execute({ subjectTaskId }) {
    const exists = await this.subjectTaskRepo.existsById(subjectTaskId);
    if (!exists) throw new ApiError(404, "SUBJECT_TASK_NOT_FOUND", "subjectTaskId not found");

    return this.reminderRepo.findBySubjectTaskId(subjectTaskId);
  }
}

module.exports = { ListSubjectTaskRemindersUseCase };
