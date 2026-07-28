// backend/src/routes/report.routes.js
const express = require("express");
const { ok } = require("../http/respond");
const { getPrisma } = require("../infra/prisma");
const { GetWeeklyReportUseCase } = require("../usecases/GetWeeklyReportUseCase");

function reportRouter() {
  const router = express.Router();

  // GET /api/report/weekly?week=YYYY-MM-DD
  router.get("/weekly", async (req, res, next) => {
    try {
      console.log("[report.routes] GET /report/weekly hit");

      const prisma = getPrisma();
      const uc = new GetWeeklyReportUseCase(prisma);

      // PowerShellやコピペで改行/空白が混ざっても死なないようにする
      let week = typeof req.query.week === "string" ? req.query.week.trim() : undefined;

      // "2026-01-08`n" みたいなの保険（先頭10文字）
      if (week && week.length >= 10) week = week.slice(0, 10);

      // 形式が変なら 400（黙って先週返すよりデバッグしやすい）
      if (week && !/^\d{4}-\d{2}-\d{2}$/.test(week)) {
        return res.status(400).json({ error: { code: "INVALID_WEEK", message: "week must be YYYY-MM-DD" } });
      }

      const result = await uc.execute({ week });
      ok(res, result);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { reportRouter };
