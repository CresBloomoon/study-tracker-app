// backend/src/repositories/ReminderRepository.js
class ReminderRepository {
    constructor(prisma) {
      this.prisma = prisma;
    }
  
    async countOpen() {
      return this.prisma.reminder.count({ where: { isDone: false } });
    }
  
    async countDone() {
      return this.prisma.reminder.count({ where: { isDone: true } });
    }
  
    async countDueTodayOpen({ startUtc, endUtc }) {
      return this.prisma.reminder.count({
        where: {
          isDone: false,
          dueAt: { gte: startUtc, lt: endUtc },
        },
      });
    }

    async create({ title, dueAt, subjectTaskId }) {
      return this.prisma.reminder.create({
        data: {
          title,
          dueAt,
          subjectTaskId,
        },
        select: {
          id: true,
          title: true,
          dueAt: true,
          isDone: true,
          doneAt: true,
          createdAt: true,
          updatedAt: true,
          subjectTaskId: true,
          reviewSeriesId: true,
        },
    });
  }

  async markDone(id, doneAt) {
    return this.prisma.reminder.update({
      where: { id },
      data: { isDone: true, doneAt },
      select: {
        id: true,
        title: true,
        dueAt: true,
        isDone: true,
        doneAt: true,
        createdAt: true,
        updatedAt: true,
        subjectTaskId: true,
        reviewSeriesId: true,
      },
    });
  }

  async markUndone(id) {
    return this.prisma.reminder.update({
      where: { id },
      data: { isDone: false, doneAt: null },
      select: {
        id: true,
        title: true,
        dueAt: true,
        isDone: true,
        doneAt: true,
        createdAt: true,
        updatedAt: true,
        subjectTaskId: true,
        reviewSeriesId: true,
      },
    });
  }

  async existsById(id) {
    const found = await this.prisma.reminder.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!found;
  }

  async findMany({ status }) {
    const where =
      status === "done"
        ? { isDone: true }
        : status === "all"
          ? {}
          : { isDone: false }; // default open

    return this.prisma.reminder.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        dueAt: true,
        isDone: true,
        doneAt: true,
        createdAt: true,
        updatedAt: true,
        subjectTaskId: true,
        reviewSeriesId: true,
      },
    });
  }

  // ガントの展開パネル用：期限日を持たない、チェックボックス+タイトルのみのリスト
  async findBySubjectTaskId(subjectTaskId) {
    return this.prisma.reminder.findMany({
      where: { subjectTaskId },
      orderBy: [{ isDone: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        isDone: true,
      },
    });
  }

  async countTotalForSubjectTask(subjectTaskId) {
    return this.prisma.reminder.count({ where: { subjectTaskId } });
  }

  async countDoneForSubjectTask(subjectTaskId) {
    return this.prisma.reminder.count({ where: { subjectTaskId, isDone: true } });
  }

  async countRecentlyCompletedForSubjectTask(subjectTaskId, sinceDate) {
    return this.prisma.reminder.count({
      where: { subjectTaskId, isDone: true, doneAt: { gte: sinceDate } },
    });
  }

  // StudyLog.linkedReminderId は onDelete: SetNull のため、削除してもStudyLog側は連鎖削除されない
  async deleteById(id) {
    await this.prisma.reminder.delete({ where: { id } });
  }

}
  
  module.exports = { ReminderRepository };
  