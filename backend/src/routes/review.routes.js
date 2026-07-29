// backend/src/routes/review.routes.js
const { Router } = require("express");
const { ok } = require("../http/respond");
const { getPrisma } = require("../infra/prisma");
const { GetSubjectBreakdownUseCase } = require("../usecases/GetSubjectBreakdownUseCase");
const { GetMonthlyStudyTrendUseCase } = require("../usecases/GetMonthlyStudyTrendUseCase");
const { GetYearlyStudyTrendUseCase } = require("../usecases/GetYearlyStudyTrendUseCase");

function reviewRouter() {
  const router = Router();

  router.get("/review/subject-breakdown", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const uc = new GetSubjectBreakdownUseCase(prisma);
      const result = await uc.execute();
      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/review/monthly-trend", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const uc = new GetMonthlyStudyTrendUseCase(prisma);
      const result = await uc.execute();
      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/review/yearly-trend", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const uc = new GetYearlyStudyTrendUseCase(prisma);
      const result = await uc.execute();
      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { reviewRouter };
