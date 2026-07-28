const { Router } = require("express");
const { ok } = require("../http/respond");
const { getPrisma } = require("../infra/prisma");
const { GetReminderSummaryUseCase } = require("../usecases/GetReminderSummaryUseCase");
const { CreateReminderUseCase } = require("../usecases/CreateReminderUseCase");
const { MarkReminderDoneUseCase } = require("../usecases/MarkReminderDoneUseCase");
const { MarkReminderUndoneUseCase } = require("../usecases/MarkReminderUndoneUseCase");
const { ListRemindersUseCase } = require("../usecases/ListRemindersUseCase");
const { validateCreateReminder } = require("./_validators/reminder");



function remindersRouter() {
  const router = Router();

  // POST /api/reminders
  router.post("/reminders", validateCreateReminder, async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const { title, dueAt, subjectTaskId } = req.body;

      const uc = new CreateReminderUseCase(prisma);
      const result = await uc.execute({ title, dueAt, subjectTaskId });

      // 201で返す（okヘルパは200固定なので直書き）
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  // GET /api/reminders/summary
  router.get("/reminders/summary", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const uc = new GetReminderSummaryUseCase(prisma);
      const result = await uc.execute();
      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  // GET /api/reminders?status=open|done|all
  router.get("/reminders", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const { status } = req.query;

      const uc = new ListRemindersUseCase(prisma);
      const result = await uc.execute({ status });

      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  });


  router.patch("/reminders/:id/done", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const { id } = req.params;
  
      const uc = new MarkReminderDoneUseCase(prisma);
      const result = await uc.execute({ id });
  
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  });

  router.patch("/reminders/:id/undone", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const { id } = req.params;
  
      const uc = new MarkReminderUndoneUseCase(prisma);
      const result = await uc.execute({ id });
  
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { remindersRouter };
