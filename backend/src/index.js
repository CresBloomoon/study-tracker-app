// backend/src/index.js
const { createApp } = require("./app");
const { getPrisma } = require("./infra/prisma");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = createApp();

getPrisma();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[backend] listening on 0.0.0.0:${PORT}`);
});
