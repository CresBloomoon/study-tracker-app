// backend/src/routes/studyLog.routes.js
const { Router } = require("express");
const { ok } = require("../http/respond");
const { getPrisma } = require("../infra/prisma");
const { ApiError } = require("../domain/errors");
const { CreateStudyLogUseCase } = require("../usecases/CreateStudyLogUseCase");
const { GetStudyLogByDateUseCase } = require("../usecases/GetStudyLogByDateUseCase");
const { requireUuid, requirePositiveInt, optionalDate, optionalUuid, optionalString } = require("../http/validation");

function studyLogRouter() {
  const router = Router();

  router.post("/study-log", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const subjectId = requireUuid(req.body.subjectId, "subjectId");
      const durationSec = requirePositiveInt(req.body.durationSec, "durationSec");
      const date = optionalDate(req.body.date, "date");
      const clientRequestId = requireUuid(req.body.clientRequestId, "clientRequestId");
      const note = optionalString(req.body.note, "note", { maxLength: 1000 });
      const linkedReminderId = optionalUuid(req.body.linkedReminderId, "linkedReminderId");

      const uc = new CreateStudyLogUseCase(prisma);
      const result = await uc.execute({ subjectId, durationSec, date, clientRequestId, note, linkedReminderId });

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/study-log", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const date = String(req.query.date ?? "");
      if (!date) throw new ApiError(400, "VALIDATION_ERROR", "date is required");

      const uc = new GetStudyLogByDateUseCase(prisma);
      const result = await uc.execute({ date });

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { studyLogRouter };
