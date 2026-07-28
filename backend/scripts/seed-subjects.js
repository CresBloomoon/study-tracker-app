const { getPrisma } = require("../src/infra/prisma");

const SUBJECTS = [
  { name: "財務会計論", colorHex: "#22c55e", sortOrder: 1 },
  { name: "管理会計論", colorHex: "#ef4444", sortOrder: 2 },
  { name: "企業法",     colorHex: "#f59e0b", sortOrder: 3 },
  { name: "監査論",     colorHex: "#84cc16", sortOrder: 4 },
  { name: "租税法",     colorHex: "#a855f7", sortOrder: 5 },
  { name: "経営学",     colorHex: "#10b981", sortOrder: 6 },
  { name: "経済学",     colorHex: "#fb7185", sortOrder: 7 },
  { name: "民法",       colorHex: "#22c55e", sortOrder: 8 },
  { name: "統計学",     colorHex: "#38bdf8", sortOrder: 9 },
];

async function main() {
  const prisma = getPrisma();

  for (const s of SUBJECTS) {
    await prisma.subject.upsert({
      where: { name: s.name }, // unique(name)があるからOK
      update: { colorHex: s.colorHex, sortOrder: s.sortOrder },
      create: {
        name: s.name,
        colorHex: s.colorHex,
        sortOrder: s.sortOrder,
        isArchived: false,
      },
    });
  }

  console.log("[seed] subjects seeded");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
