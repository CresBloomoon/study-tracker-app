// backend/src/usecases/GetSubjectsUseCase.js
const { SubjectRepository } = require("../repositories/SubjectRepository");

class GetSubjectsUseCase {
  constructor(prisma) {
    this.subjectRepo = new SubjectRepository(prisma);
  }

  async execute() {
    return this.subjectRepo.findActiveSorted();
  }
}

module.exports = { GetSubjectsUseCase };
