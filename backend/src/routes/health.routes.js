const { Router } = require("express");
const { getPrisma } = require("../infra/prisma");
const { ok } = require("../http/respond");

function healthRouter() {
  const router = Router();

  router.get("/health", async (req, res, next) => {
    try {
      const prisma = getPrisma();
      // 既存の /api/health と同じ疎通確認ロジックを移植してOK
      // とりあえず例: 何か軽いクエリ（実装済みに合わせて差し替え）
      await prisma.$queryRaw`SELECT 1`;
      ok(res, { ok: true, db: true });
    } catch (e) {
      // db false に落とすならここで整形しても良い
      next(e);
    }
  });

  return router;
}

module.exports = { healthRouter };
