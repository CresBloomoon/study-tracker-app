// backend/src/usecases/ListReviewRecipesUseCase.js
const { ReviewRecipeRepository } = require("../repositories/ReviewRecipeRepository");

class ListReviewRecipesUseCase {
  constructor(prisma) {
    this.repo = new ReviewRecipeRepository(prisma);
  }

  async execute() {
    const items = await this.repo.findAllSorted();

    return items.map((r) => ({
      id: r.id,
      name: r.name,
      intervalDays: r.intervalDays,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}

module.exports = { ListReviewRecipesUseCase };
