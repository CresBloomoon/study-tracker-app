// backend/src/usecases/GetMilestoneUseCase.js
const { formatPlainDate } = require("../domain/time");
const { MilestoneRepository } = require("../repositories/MilestoneRepository");
const { ReminderRepository } = require("../repositories/ReminderRepository");
const { computeSubjectTaskProgress, PACE_LOOKBACK_DAYS } = require("../domain/subjectTaskProgress");

class GetMilestoneUseCase {
  constructor(prisma) {
    this.repo = new MilestoneRepository(prisma);
    this.reminderRepo = new ReminderRepository(prisma);
  }

  async execute({ id, now = new Date() }) {
    const milestone = await this.repo.findByIdWithSubjectTasks(id);
    if (!milestone) return null;

    const sinceDate = new Date(now.getTime() - PACE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const subjectTasks = await Promise.all(
      milestone.subjectTasks.map((t) => this.buildSubjectTaskWithProgress(t, sinceDate, now))
    );

    return {
      id: milestone.id,
      name: milestone.name,
      deadlineDate: formatPlainDate(milestone.deadlineDate),
      createdAt: milestone.createdAt.toISOString(),
      subjectTasks,
    };
  }

  async buildSubjectTaskWithProgress(subjectTask, sinceDate, now) {
    const [totalCount, doneCount, recentlyCompletedCount] = await Promise.all([
      this.reminderRepo.countTotalForSubjectTask(subjectTask.id),
      this.reminderRepo.countDoneForSubjectTask(subjectTask.id),
      this.reminderRepo.countRecentlyCompletedForSubjectTask(subjectTask.id, sinceDate),
    ]);

    const { estimatedFinishDate, paceStatus } = computeSubjectTaskProgress({
      doneCount,
      totalCount,
      recentlyCompletedCount,
      endDate: subjectTask.endDate,
      now,
    });

    return {
      id: subjectTask.id,
      subjectId: subjectTask.subjectId,
      startDate: formatPlainDate(subjectTask.startDate),
      endDate: formatPlainDate(subjectTask.endDate),
      createdAt: subjectTask.createdAt.toISOString(),
      progress: {
        doneCount,
        totalCount,
        estimatedFinishDate,
        paceStatus,
      },
    };
  }
}

module.exports = { GetMilestoneUseCase };
