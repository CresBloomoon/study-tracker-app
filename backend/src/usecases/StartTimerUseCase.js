const { ApiError } = require("../domain/errors");
const { TimerSessionRepository } = require("../repositories/TimerSessionRepository");
const { randomUUID } = require("crypto");

function safeInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function normalizeMode(mode) {
  if (!mode) return "STOPWATCH";
  const m = String(mode).toUpperCase();
  if (m === "POMODORO") return "POMODORO";
  if (m === "STOPWATCH") return "STOPWATCH";
  throw new ApiError(400, "INVALID_MODE", "mode must be STOPWATCH or POMODORO");
}

function normalizePomodoroConfig(config) {
  if (!config || typeof config !== "object") {
    throw new ApiError(400, "INVALID_CONFIG", "config is required for POMODORO");
  }

  const focusMin = safeInt(config.focusMin);
  const breakMin = safeInt(config.breakMin);
  const totalSets = safeInt(config.totalSets);

  if (!focusMin || focusMin <= 0 || focusMin > 600) {
    throw new ApiError(400, "INVALID_CONFIG", "focusMin must be 1..600");
  }
  if (breakMin == null || breakMin < 0 || breakMin > 600) {
    throw new ApiError(400, "INVALID_CONFIG", "breakMin must be 0..600");
  }
  if (!totalSets || totalSets <= 0 || totalSets > 100) {
    throw new ApiError(400, "INVALID_CONFIG", "totalSets must be 1..100");
  }

  return { focusMin, breakMin, totalSets };
}

class StartTimerUseCase {
  constructor(prisma) {
    this.prisma = prisma;
    this.timerRepo = new TimerSessionRepository(prisma);
  }

  async execute({ subjectId, clientRequestId, mode, config }) {
    const normalizedMode = normalizeMode(mode);

    // 冪等スタート
    if (clientRequestId) {
      const existing = await this.timerRepo.findByClientRequestId(clientRequestId);
      if (existing) return existing;
    }

    // すでに RUNNING があればそれを返す
    const running = await this.timerRepo.findRunning();
    if (running) return running;

    // ★ここが重要：UseCaseで生成
    const id = randomUUID();
    const startedAt = new Date();

    if (normalizedMode === "POMODORO") {
      const cfg = normalizePomodoroConfig(config);

      return await this.timerRepo.start({
        id,
        subjectId,
        startedAt,
        clientRequestId,
        mode: "POMODORO",
        configJson: cfg,
        phase: "FOCUS",
        setIndex: 1,
        totalSets: cfg.totalSets,
      });
    }

    // STOPWATCH
    return await this.timerRepo.start({
      id,
      subjectId,
      startedAt,
      clientRequestId,
      mode: "STOPWATCH",
    });
  }
}

module.exports = { StartTimerUseCase };
