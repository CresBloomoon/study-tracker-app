const { SubjectRepository } = require("../repositories/SubjectRepository");
const { ApiError } = require("../domain/errors");

class ReorderSubjectsUseCase {
  constructor(prisma) {
    this.prisma = prisma;
    this.subjectRepo = new SubjectRepository(prisma);
  }

  async execute({ orders }) {
    if (!Array.isArray(orders) || orders.length === 0) {
      throw new ApiError(400, "INVALID_ORDER", "orders is required");
    }

    const prisma = this.prisma;

    await prisma.$transaction(
      orders.map(({ id, sortOrder }) =>
        prisma.subject.update({
          where: { id },
          data: { sortOrder },
        })
      )
    );
  }
}

module.exports = { ReorderSubjectsUseCase };
