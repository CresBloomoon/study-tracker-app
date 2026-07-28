// backend/src/routes/timer.routes.js

const { Router } = require("express");
const { ok } = require("../http/respond");
const { requireUuid, optionalUuid } = require("../http/validation");
const { StartTimerUseCase } = require("../usecases/StartTimerUseCase");
const { StopTimerUseCase } = require("../usecases/StopTimerUseCase");
const { ResumeTimerUseCase } = require("../usecases/ResumeTimerUseCase");
const { GetCurrentTimerUseCase } = require("../usecases/GetCurrentTimerUseCase");
const { AdvanceTimerUseCase } = require("../usecases/AdvanceTimerUseCase");
const { RecordTimerUseCase } = require("../usecases/RecordTimerUseCase");
const { getPrisma } = require("../infra/prisma");

function timerRouter() {
  const router = Router();

  // 現在のタイマー状態（RUNNING/PAUSED/IDLE）
  router.get("/timer/current", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const uc = new GetCurrentTimerUseCase(prisma);
      const result = await uc.execute();
      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  router.post("/timer/start", async (req, res, next) => {
    try {
      const prisma = getPrisma();

      const subjectId = optionalUuid(req.body.subjectId, "subjectId");
      const clientRequestId = optionalUuid(req.body.clientRequestId, "clientRequestId");
      const mode = req.body.mode;
      const config = req.body.config;

      const uc = new StartTimerUseCase(prisma);
      const result = await uc.execute({
        subjectId,
        clientRequestId,
        mode,
        config,
      });

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  // ★ポモドーロの次フェーズへ進める（DONEのときだけ）
  // ★B4: clientRequestId必須（冪等）
  router.post("/timer/advance", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const clientRequestId = requireUuid(req.body.clientRequestId, "clientRequestId");

      const uc = new AdvanceTimerUseCase(prisma);
      const result = await uc.execute({ clientRequestId });

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  // 中央ボタン：RUNNING -> PAUSED（一時停止）
  router.post("/timer/stop", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const clientRequestId = requireUuid(req.body.clientRequestId, "clientRequestId");

      const uc = new StopTimerUseCase(prisma);
      const result = await uc.execute({ clientRequestId });

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  // 中央ボタン：PAUSED -> RUNNING（再開）
  router.post("/timer/resume", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const clientRequestId = requireUuid(req.body.clientRequestId, "clientRequestId");

      const uc = new ResumeTimerUseCase(prisma);
      const result = await uc.execute({ clientRequestId });

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  // ★記録：StudyLogを作るのはここだけ（ADR-013）
  router.post("/timer/record", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      const clientRequestId = requireUuid(req.body.clientRequestId, "clientRequestId");
      const note = req.body.note ?? null;

      const uc = new RecordTimerUseCase(prisma);
      const result = await uc.execute({ clientRequestId, note });

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { timerRouter };
