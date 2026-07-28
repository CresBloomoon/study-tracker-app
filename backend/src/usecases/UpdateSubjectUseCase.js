const { SubjectRepository } = require("../repositories/SubjectRepository");
const { ApiError } = require("../domain/errors");

class UpdateSubjectUseCase {
  constructor(prisma) {
    this.subjectRepo = new SubjectRepository(prisma);
  }

  async execute({ id, colorHex, isArchived, name }) {
    // ❌ 科目名は変更不可
    if (name !== undefined) {
      throw new ApiError(400, "INVALID_UPDATE", "Subject name cannot be changed");
    }

    // 何も来てないなら更新しない
    if (colorHex === undefined && isArchived === undefined) {
      throw new ApiError(400, "NO_FIELDS", "Nothing to update");
    }

    // 存在チェック
    const exists = await this.subjectRepo.existsById(id);
    if (!exists) {
      throw new ApiError(404, "NOT_FOUND", "Subject not found");
    }

    return this.subjectRepo.updateById(id, { colorHex, isArchived });
  }
}

module.exports = { UpdateSubjectUseCase };
