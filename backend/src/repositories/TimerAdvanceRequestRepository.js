// backend/src/repositories/TimerAdvanceRequestRepository.js

class TimerAdvanceRequestRepository {
    constructor(prisma) {
      this.prisma = prisma;
    }
  
    async create({ clientRequestId, timerSessionId }) {
      return this.prisma.timerAdvanceRequest.create({
        data: {
          clientRequestId,
          timerSessionId,
        },
      });
    }
  }
  
  module.exports = { TimerAdvanceRequestRepository };
  