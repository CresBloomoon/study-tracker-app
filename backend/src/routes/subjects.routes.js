// backend/src/routes/subjects.routes.js
const { Router } = require("express");
const { ok } = require("../http/respond");
const { getPrisma } = require("../infra/prisma");
const { GetSubjectsUseCase } = require("../usecases/GetSubjectsUseCase");
const { GetSubjectsAllUseCase } = require("../usecases/GetSubjectsAllUseCase");
const { UpdateSubjectUseCase } = require("../usecases/UpdateSubjectUseCase");
const { ReorderSubjectsUseCase } = require("../usecases/ReorderSubjectsUseCase");


console.log("[subjects.routes] loaded");


function subjectsRouter() {
  console.log("[subjects.routes] router mounted");
  const router = Router();

  router.get("/subjects", async (req, res, next) => {
    console.log("[subjects.routes] GET /subjects hit");
    try {
      const prisma = getPrisma();

      const uc = new GetSubjectsUseCase(prisma);
      const result = await uc.execute();

      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/subjects/all", async (req, res, next) => {
    console.log("[subjects.routes] GET /subjects/all hit");
    try {
      const prisma = getPrisma();
  
      const uc = new GetSubjectsAllUseCase(prisma);
      const result = await uc.execute();
  
      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  router.patch("/subjects/reorder", async (req, res, next) => {
    console.log("[subjects.routes] PATCH /subjects/reorder hit");

    try {
      const prisma = getPrisma();
      const { orders } = req.body;

      console.log("[debug] prisma keys:", Object.keys(prisma));
      console.log("[debug] has $transaction:", typeof prisma.$transaction);
      console.log("[debug] has subject.update:", typeof prisma.subject?.update);
  
      const uc = new ReorderSubjectsUseCase(prisma);
      await uc.execute({ orders });
  
      ok(res, { success: true });
    } catch (e) {
      next(e);
    }
  });

  router.patch("/subjects/:id", async (req, res, next) => {
    console.log("[subjects.routes] PATCH /subjects/:id hit");
    try {
      const prisma = getPrisma();
      const { id } = req.params;
      const { colorHex, isArchived, name } = req.body;
  
      const uc = new UpdateSubjectUseCase(prisma);
      const result = await uc.execute({ id, colorHex, isArchived, name });
  
      ok(res, result);
    } catch (e) {
      next(e);
    }
  });


  
  

  return router;
}

module.exports = { subjectsRouter };
