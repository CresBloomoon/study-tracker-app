// backend/src/repositories/ReviewSeriesRepository.js
// ReviewSeries作成はReminder一括生成とアトミックに行う必要があるため、
// 書き込みはCreateReviewSeriesUseCase側でprisma.$transactionを直接使う（AdvanceTimerUseCaseと同じ方針）。
// このRepositoryは読み取り専用。
class ReviewSeriesRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findById(id) {
    return this.prisma.reviewSeries.findUnique({
      where: { id },
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
  }

  async findAllSorted() {
    return this.prisma.reviewSeries.findMany({
      orderBy: [{ createdAt: "desc" }],
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
  }
}

module.exports = { ReviewSeriesRepository };
