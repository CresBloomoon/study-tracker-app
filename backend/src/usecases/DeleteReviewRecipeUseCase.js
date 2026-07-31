// backend/src/usecases/DeleteReviewRecipeUseCase.js
const { ApiError } = require("../domain/errors");
const { ReviewRecipeRepository } = require("../repositories/ReviewRecipeRepository");

class DeleteReviewRecipeUseCase {
  constructor(prisma) {
    this.repo = new ReviewRecipeRepository(prisma);
  }

  async execute({ id }) {
    const exists = await this.repo.existsById(id);
    if (!exists) throw new ApiError(404, "REVIEW_RECIPE_NOT_FOUND", "review recipe not found");

    await this.repo.deleteById(id);
  }
}

module.exports = { DeleteReviewRecipeUseCase };
