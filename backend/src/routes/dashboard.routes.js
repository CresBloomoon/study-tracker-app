const { Router } = require("express");
const { getPrisma } = require("../infra/prisma");

const { GetDashboardSummaryUseCase } = require("../usecases/GetDashboardSummaryUseCase");
const { GetWeeklyStudyUseCase } = require("../usecases/GetWeeklyStudyUseCase");

function dashboardRouter() {
  const router = Router();

  router.get("/summary", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const uc = new GetDashboardSummaryUseCase(prisma);
      const result = await uc.execute();
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/weekly", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const uc = new GetWeeklyStudyUseCase(prisma);

      const weekStartsOn =
        req.query.weekStartsOn === "SUN" ? "SUN" :
        req.query.weekStartsOn === "MON" ? "MON" : undefined;

      const weeklyMode =
        req.query.mode === "LAST_7_DAYS" ? "LAST_7_DAYS" :
        req.query.mode === "CALENDAR_WEEK" ? "CALENDAR_WEEK" : undefined;

      const result = await uc.execute({ weekStartsOn, weeklyMode });
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { dashboardRouter };
