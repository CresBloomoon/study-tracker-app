// backend/src/usecases/CreateSubjectTaskUseCase.js
const { ApiError } = require("../domain/errors");
const { parsePlainDate, formatPlainDate } = require("../domain/time");
const { MilestoneRepository } = require("../repositories/MilestoneRepository");
const { SubjectRepository } = require("../repositories/SubjectRepository");
const { SubjectTaskRepository } = require("../repositories/SubjectTaskRepository");

class CreateSubjectTaskUseCase {
  constructor(prisma) {
    this.milestoneRepo = new MilestoneRepository(prisma);
    this.subjectRepo = new SubjectRepository(prisma);
    this.subjectTaskRepo = new SubjectTaskRepository(prisma);
  }

  async execute({ milestoneId, subjectId, startDate, endDate }) {
    const milestoneExists = await this.milestoneRepo.existsById(milestoneId);
    if (!milestoneExists) throw new ApiError(404, "MILESTONE_NOT_FOUND", "milestoneId not found");

    const subjectExists = await this.subjectRepo.existsById(subjectId);
    if (!subjectExists) throw new ApiError(404, "SUBJECT_NOT_FOUND", "subjectId not found");

    const startDateValue = parsePlainDate(startDate);
    const endDateValue = parsePlainDate(endDate);
    if (startDateValue.getTime() > endDateValue.getTime()) {
      throw new ApiError(400, "VALIDATION_ERROR", "startDate must not be after endDate");
    }

    const created = await this.subjectTaskRepo.create({
      milestoneId,
      subjectId,
      startDate: startDateValue,
      endDate: endDateValue,
    });

    return {
      id: created.id,
      milestoneId: created.milestoneId,
      subjectId: created.subjectId,
      startDate: formatPlainDate(created.startDate),
      endDate: formatPlainDate(created.endDate),
      createdAt: created.createdAt.toISOString(),
    };
  }
}

module.exports = { CreateSubjectTaskUseCase };
