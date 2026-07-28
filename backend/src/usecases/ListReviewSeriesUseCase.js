// backend/src/usecases/ListReviewSeriesUseCase.js
const { formatPlainDate } = require("../domain/time");
const { ReviewSeriesRepository } = require("../repositories/ReviewSeriesRepository");

class ListReviewSeriesUseCase {
  constructor(prisma) {
    this.repo = new ReviewSeriesRepository(prisma);
  }

  async execute() {
    const items = await this.repo.findAllSorted();

    return items.map((s) => ({
      id: s.id,
      title: s.title,
      subjectId: s.subjectId,
      baseDate: formatPlainDate(s.baseDate),
      intervalDays: s.intervalDays,
      recipeId: s.recipeId,
      subjectTaskId: s.subjectTaskId,
      createdAt: s.createdAt.toISOString(),
    }));
  }
}

module.exports = { ListReviewSeriesUseCase };
