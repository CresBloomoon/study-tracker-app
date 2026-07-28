class SubjectRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async existsById(id) {
    const found = await this.prisma.subject.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!found;
  }

  // ★追加：アーカイブされてない科目を並び順で取得
  async findActiveSorted() {
    return this.prisma.subject.findMany({
      where: { isArchived: false },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], // 同順の揺れ防止
      select: { id: true, name: true, colorHex: true, sortOrder: true },
    });
  }

  async findAllSorted() {
    return this.prisma.subject.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        colorHex: true,
        sortOrder: true,
        isArchived: true,
      },
    });
  }

  async updateById(id, { colorHex, isArchived }) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        ...(colorHex !== undefined ? { colorHex } : {}),
        ...(isArchived !== undefined ? { isArchived } : {}),
      },
      select: {
        id: true,
        name: true,
        colorHex: true,
        sortOrder: true,
        isArchived: true,
      },
    });
  }
  
  async updateSortOrder(id, sortOrder) {
    return this.prisma.subject.update({
      where: { id },
      data: { sortOrder },
    });
  }

  //タイマーが subject 未指定で止まった時の受け皿
  async getOrCreateUnassigned() {
    return this.prisma.subject.upsert({
      where: { name: "未分類" },
      update: {},
      create: {
        name: "未分類",
        colorHex: "#6b7280",
        sortOrder: 0,
        isArchived: false,
      },
      select: { id: true, name: true, colorHex: true },
    });
  }

  async findByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    return this.prisma.subject.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, colorHex: true, sortOrder: true, isArchived: true },
    });
  }

  
  
}

module.exports = { SubjectRepository };
