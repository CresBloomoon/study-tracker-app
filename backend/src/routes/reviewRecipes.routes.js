// backend/src/routes/reviewRecipes.routes.js
const { Router } = require("express");
const { ok } = require("../http/respond");
const { getPrisma } = require("../infra/prisma");
const { requireUuid, requireNonEmptyString, requirePositiveIntArray } = require("../http/validation");
const { CreateReviewRecipeUseCase } = require("../usecases/CreateReviewRecipeUseCase");
const { ListReviewRecipesUseCase } = require("../usecases/ListReviewRecipesUseCase");
const { UpdateReviewRecipeUseCase } = require("../usecases/UpdateReviewRecipeUseCase");
const { DeleteReviewRecipeUseCase } = require("../usecases/DeleteReviewRecipeUseCase");

function reviewRecipesRouter() {
  const router = Router();

  router.post("/review-recipes", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const name = requireNonEmptyString(req.body.name, "name", { maxLength: 200 });
      const intervalDays = requirePositiveIntArray(req.body.intervalDays, "intervalDays");

      const uc = new CreateReviewRecipeUseCase(prisma);
      const result = await uc.execute({ name, intervalDays });

      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/review-recipes", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const uc = new ListReviewRecipesUseCase(prisma);
      const result = await uc.execute();

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  router.patch("/review-recipes/:id", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const id = requireUuid(req.params.id, "id");
      const name = req.body.name !== undefined
        ? requireNonEmptyString(req.body.name, "name", { maxLength: 200 })
        : undefined;
      const intervalDays = req.body.intervalDays !== undefined
        ? requirePositiveIntArray(req.body.intervalDays, "intervalDays")
        : undefined;

      const uc = new UpdateReviewRecipeUseCase(prisma);
      const result = await uc.execute({ id, name, intervalDays });

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  router.delete("/review-recipes/:id", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const id = requireUuid(req.params.id, "id");

      const uc = new DeleteReviewRecipeUseCase(prisma);
      await uc.execute({ id });

      ok(res, { success: true });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { reviewRecipesRouter };
