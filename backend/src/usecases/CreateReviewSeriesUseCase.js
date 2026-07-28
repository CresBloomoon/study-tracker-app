// backend/src/usecases/CreateReviewSeriesUseCase.js
const { ApiError } = require("../domain/errors");
const { parsePlainDate, formatPlainDate, addJstDays } = require("../domain/time");
const { ReviewRecipeRepository } = require("../repositories/ReviewRecipeRepository");
const { SubjectRepository } = require("../repositories/SubjectRepository");
const { SubjectTaskRepository } = require("../repositories/SubjectTaskRepository");

function formatReminder(r) {
  return {
    id: r.id,
    title: r.title,
    dueAt: r.dueAt.toISOString(),
    isDone: r.isDone,
    doneAt: r.doneAt ? r.doneAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    subjectTaskId: r.subjectTaskId,
    reviewSeriesId: r.reviewSeriesId,
  };
}

class CreateReviewSeriesUseCase {
  constructor(prisma) {
    this.prisma = prisma;
    this.recipeRepo = new ReviewRecipeRepository(prisma);
    this.subjectRepo = new SubjectRepository(prisma);
    this.subjectTaskRepo = new SubjectTaskRepository(prisma);
  }

  async execute({ title, subjectId, baseDate, recipeId, subjectTaskId }) {
    const recipe = await this.recipeRepo.findById(recipeId);
    if (!recipe) throw new ApiError(404, "REVIEW_RECIPE_NOT_FOUND", "recipeId not found");

    const subjectExists = await this.subjectRepo.existsById(subjectId);
    if (!subjectExists) throw new ApiError(404, "SUBJECT_NOT_FOUND", "subjectId not found");

    if (subjectTaskId) {
      const subjectTaskExists = await this.subjectTaskRepo.existsById(subjectTaskId);
      if (!subjectTaskExists) throw new ApiError(404, "SUBJECT_TASK_NOT_FOUND", "subjectTaskId not found");
    }

    // レシピのintervalDaysをこの時点でスナップショットしてコピーする。
    // 後でRecipeを編集/削除しても、既に作成済みのSeriesには影響させない。
    const intervalDays = recipe.intervalDays;
    const baseDateValue = parsePlainDate(baseDate);
    const normalizedSubjectTaskId = subjectTaskId ?? null;

    const { series, reminders } = await this.prisma.$transaction(async (tx) => {
      const series = await tx.reviewSeries.create({
        data: {
          title,
          subjectId,
          baseDate: baseDateValue,
          intervalDays,
          recipeId,
          subjectTaskId: normalizedSubjectTaskId,
        },
        select: {
          id: true,
          title: true,
          subjectId: true,
          baseDate: true,
          intervalDays: true,
          recipeId: true,
          subjectTaskId: true,
          createdAt: true,
        },
      });

      // Reminderを一括生成。SubjectTaskへも紐付けてGantt進捗バッジに反映されるようにする。
      const reminders = await Promise.all(
        intervalDays.map((n) =>
          tx.reminder.create({
            data: {
              title: series.title,
              dueAt: addJstDays(baseDateValue, n),
              reviewSeriesId: series.id,
              subjectTaskId: normalizedSubjectTaskId,
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
          })
        )
      );

      return { series, reminders };
    });

    return {
      id: series.id,
      title: series.title,
      subjectId: series.subjectId,
      baseDate: formatPlainDate(series.baseDate),
      intervalDays: series.intervalDays,
      recipeId: series.recipeId,
      subjectTaskId: series.subjectTaskId,
      createdAt: series.createdAt.toISOString(),
      reminders: reminders.map(formatReminder),
    };
  }
}

module.exports = { CreateReviewSeriesUseCase };
