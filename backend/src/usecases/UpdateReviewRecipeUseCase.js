// backend/src/usecases/UpdateReviewRecipeUseCase.js
const { ApiError } = require("../domain/errors");
const { ReviewRecipeRepository } = require("../repositories/ReviewRecipeRepository");

class UpdateReviewRecipeUseCase {
  constructor(prisma) {
    this.repo = new ReviewRecipeRepository(prisma);
  }

  async execute({ id, name, intervalDays }) {
    if (name === undefined && intervalDays === undefined) {
      throw new ApiError(400, "NO_FIELDS", "Nothing to update");
    }

    const exists = await this.repo.existsById(id);
    if (!exists) throw new ApiError(404, "REVIEW_RECIPE_NOT_FOUND", "review recipe not found");

    const updated = await this.repo.update(id, { name, intervalDays });

    return {
      id: updated.id,
      name: updated.name,
      intervalDays: updated.intervalDays,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}

module.exports = { UpdateReviewRecipeUseCase };
