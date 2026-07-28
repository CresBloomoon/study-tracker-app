const { ApiError } = require("../domain/errors");
const { ReminderRepository } = require("../repositories/ReminderRepository");
const { getJstTodayRange } = require("../domain/time");
const { classifyDueness, isOverdue } = require("../domain/reminderPriority");

class ListRemindersUseCase {
  constructor(prisma) {
    this.repo = new ReminderRepository(prisma);
  }

  async execute({ status, now = new Date() }) {
    const s = status ?? "open";
    if (!["open", "done", "all"].includes(s)) {
      throw new ApiError(400, "VALIDATION_ERROR", "status must be open|done|all");
    }

    const items = await this.repo.findMany({ status: s });

    // 「今日期限を先頭に」の優先並び替えと isOverdue フラグは status=open のみ適用
    if (s !== "open") {
      return items.map((r) => ({
        ...r,
        dueAt: r.dueAt.toISOString(),
        doneAt: r.doneAt ? r.doneAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    }

    const todayRange = getJstTodayRange(now);

    // repo側は dueAt 昇順 → createdAt 昇順で返す。sortは安定ソートなので、
    // 優先度（TODAY -> OVERDUE -> FUTURE）でまとめても各バケツ内の順序は保たれる。
    const sorted = [...items].sort(
      (a, b) => classifyDueness(a.dueAt, todayRange) - classifyDueness(b.dueAt, todayRange)
    );

    return sorted.map((r) => ({
      ...r,
      dueAt: r.dueAt.toISOString(),
      doneAt: r.doneAt ? r.doneAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      isOverdue: isOverdue(r.dueAt, r.isDone, todayRange),
    }));
  }
}

module.exports = { ListRemindersUseCase };
