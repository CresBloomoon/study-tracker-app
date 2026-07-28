// backend/src/routes/reviewSeries.routes.js
const { Router } = require("express");
const { ok } = require("../http/respond");
const { getPrisma } = require("../infra/prisma");
const { requireUuid, requireNonEmptyString, requireDate, optionalUuid } = require("../http/validation");
const { CreateReviewSeriesUseCase } = require("../usecases/CreateReviewSeriesUseCase");
const { ListReviewSeriesUseCase } = require("../usecases/ListReviewSeriesUseCase");

function reviewSeriesRouter() {
  const router = Router();

  router.post("/review-series", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const title = requireNonEmptyString(req.body.title, "title", { maxLength: 200 });
      const subjectId = requireUuid(req.body.subjectId, "subjectId");
      const baseDate = requireDate(req.body.baseDate, "baseDate");
      const recipeId = requireUuid(req.body.recipeId, "recipeId");
      const subjectTaskId = optionalUuid(req.body.subjectTaskId, "subjectTaskId");

      const uc = new CreateReviewSeriesUseCase(prisma);
      const result = await uc.execute({ title, subjectId, baseDate, recipeId, subjectTaskId });

      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/review-series", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const uc = new ListReviewSeriesUseCase(prisma);
      const result = await uc.execute();

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { reviewSeriesRouter };
