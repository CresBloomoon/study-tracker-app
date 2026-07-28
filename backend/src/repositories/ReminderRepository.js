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

}
  
  module.exports = { ReminderRepository };
  