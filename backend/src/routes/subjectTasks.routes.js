// backend/src/routes/subjectTasks.routes.js
const { Router } = require("express");
const { ok } = require("../http/respond");
const { getPrisma } = require("../infra/prisma");
const { requireUuid, requireDate } = require("../http/validation");
const { CreateSubjectTaskUseCase } = require("../usecases/CreateSubjectTaskUseCase");
const { ListSubjectTasksUseCase } = require("../usecases/ListSubjectTasksUseCase");

function subjectTasksRouter() {
  const router = Router();

  router.post("/subject-tasks", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const milestoneId = requireUuid(req.body.milestoneId, "milestoneId");
      const subjectId = requireUuid(req.body.subjectId, "subjectId");
      const startDate = requireDate(req.body.startDate, "startDate");
      const endDate = requireDate(req.body.endDate, "endDate");

      const uc = new CreateSubjectTaskUseCase(prisma);
      const result = await uc.execute({ milestoneId, subjectId, startDate, endDate });

      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/subject-tasks", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const milestoneId = requireUuid(req.query.milestoneId, "milestoneId");

      const uc = new ListSubjectTasksUseCase(prisma);
      const result = await uc.execute({ milestoneId });

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { subjectTasksRouter };
