// backend/src/infra/prisma.js
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

let prismaSingleton = null;
let poolSingleton = null;

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  // pg Pool: 必要になったら max など調整でOK
  return new Pool({
    connectionString: url,
  });
}

function initPrisma() {
  if (prismaSingleton) return prismaSingleton;

  poolSingleton = poolSingleton ?? createPool();
  const adapter = new PrismaPg(poolSingleton);

  prismaSingleton = new PrismaClient({
    adapter,
    // 必要ならログを追加:
    // log: ["error", "warn"],
  });

  return prismaSingleton;
}

function getPrisma() {
  return initPrisma();
}

module.exports = { getPrisma };
