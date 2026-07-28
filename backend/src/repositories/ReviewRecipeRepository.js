// backend/src/repositories/ReviewRecipeRepository.js
class ReviewRecipeRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create({ name, intervalDays }) {
    return this.prisma.reviewRecipe.create({
      data: { name, intervalDays },
      select: { id: true, name: true, intervalDays: true, createdAt: true },
    });
  }

  async findById(id) {
    return this.prisma.reviewRecipe.findUnique({
      where: { id },
      select: { id: true, name: true, intervalDays: true, createdAt: true },
    });
  }

  async findAllSorted() {
    return this.prisma.reviewRecipe.findMany({
      orderBy: [{ createdAt: "asc" }],
      select: { id: true, name: true, intervalDays: true, createdAt: true },
    });
  }

  async existsById(id) {
    const found = await this.prisma.reviewRecipe.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!found;
  }

  async update(id, { name, intervalDays }) {
    return this.prisma.reviewRecipe.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(intervalDays !== undefined ? { intervalDays } : {}),
      },
      select: { id: true, name: true, intervalDays: true, createdAt: true },
    });
  }
}

module.exports = { ReviewRecipeRepository };
