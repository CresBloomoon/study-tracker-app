// backend/src/routes/milestones.routes.js
const { Router } = require("express");
const { ok } = require("../http/respond");
const { getPrisma } = require("../infra/prisma");
const { ApiError } = require("../domain/errors");
const { requireUuid, requireNonEmptyString, requireDate } = require("../http/validation");
const { CreateMilestoneUseCase } = require("../usecases/CreateMilestoneUseCase");
const { ListMilestonesUseCase } = require("../usecases/ListMilestonesUseCase");
const { GetMilestoneUseCase } = require("../usecases/GetMilestoneUseCase");

function milestonesRouter() {
  const router = Router();

  router.post("/milestones", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const name = requireNonEmptyString(req.body.name, "name", { maxLength: 200 });
      const deadlineDate = requireDate(req.body.deadlineDate, "deadlineDate");

      const uc = new CreateMilestoneUseCase(prisma);
      const result = await uc.execute({ name, deadlineDate });

      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/milestones", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const uc = new ListMilestonesUseCase(prisma);
      const result = await uc.execute();

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/milestones/:id", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const id = requireUuid(req.params.id, "id");

      const uc = new GetMilestoneUseCase(prisma);
      const result = await uc.execute({ id });
      if (!result) throw new ApiError(404, "MILESTONE_NOT_FOUND", "milestone not found");

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { milestonesRouter };
