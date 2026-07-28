const { SubjectRepository } = require("../repositories/SubjectRepository");

class GetSubjectsAllUseCase {
  constructor(prisma) {
    this.subjectRepo = new SubjectRepository(prisma);
  }

  async execute() {
    return this.subjectRepo.findAllSorted();
  }
}

module.exports = { GetSubjectsAllUseCase };
