// backend/src/usecases/CreateReviewRecipeUseCase.js
const { ReviewRecipeRepository } = require("../repositories/ReviewRecipeRepository");

class CreateReviewRecipeUseCase {
  constructor(prisma) {
    this.repo = new ReviewRecipeRepository(prisma);
  }

  async execute({ name, intervalDays }) {
    const created = await this.repo.create({ name, intervalDays });

    return {
      id: created.id,
      name: created.name,
      intervalDays: created.intervalDays,
      createdAt: created.createdAt.toISOString(),
    };
  }
}

module.exports = { CreateReviewRecipeUseCase };
