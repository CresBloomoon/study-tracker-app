// backend/src/usecases/AdvanceTimerUseCase.js

const { ApiError } = require("../domain/errors");
const { TimerSessionRepository } = require("../repositories/TimerSessionRepository");
const { GetCurrentTimerUseCase } = require("./GetCurrentTimerUseCase");

function safeInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function normalizePomodoroConfig(config) {
  // StartTimerUseCase と同じ制約（configJsonはスナップショットなので信用してよいが、壊れてたら400で落とす）
  if (!config || typeof config !== "object") {
    throw new ApiError(400, "INVALID_CONFIG", "configJson is missing");
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

function addSeconds(date, sec) {
  return new Date(date.getTime() + sec * 1000);
}

function isPrismaUniqueError(e) {
  // Prisma P2002: Unique constraint failed
  return e && (e.code === "P2002" || (typeof e.message === "string" && e.message.includes("P2002")));
}

class AdvanceTimerUseCase {
  constructor(prisma) {
    this.prisma = prisma;
    this.timerRepo = new TimerSessionRepository(prisma);
  }

  async execute({ clientRequestId }) {
    if (!clientRequestId) {
      // ルートでrequireUuidしてるが、UseCase単体でも守る
      throw new ApiError(400, "CLIENT_REQUEST_ID_REQUIRED", "clientRequestId is required");
    }

    // ★B4: まず「このclientRequestIdは処理済み？」をチェック（冪等）
    // 同じIDなら NO-OP で「今の状態」を返す
    const already = await this.prisma.timerAdvanceRequest.findUnique({
      where: { clientRequestId },
      select: { id: true },
    });
    if (already) {
      const current = await new GetCurrentTimerUseCase(this.prisma).execute();
      return {
        ...current,
        advanced: false,
        clientRequestId,
      };
    }

    const serverNow = new Date();

    // 進める対象は「今RUNNINGのセッション」
    const running = await this.timerRepo.findRunning();
    if (!running) {
      throw new ApiError(409, "NO_RUNNING_TIMER", "no running timer");
    }

    if ((running.mode || "STOPWATCH") !== "POMODORO") {
      throw new ApiError(409, "NOT_POMODORO", "timer is not POMODORO mode");
    }

    // advance は DONE のときだけ
    if (running.phase !== "DONE") {
      // NOTE: 連打で「すでに次フェーズに進んでた」場合は、ここに来る可能性がある
      // ただしその場合でも clientRequestId が同じなら↑の already で救済される
      throw new ApiError(409, "NOT_DONE", "pomodoro phase is not DONE");
    }

    const awaiting = running.awaitingAfterPhase;
    if (awaiting !== "FOCUS" && awaiting !== "BREAK") {
      throw new ApiError(
        409,
        "MISSING_AWAITING_AFTER_PHASE",
        "awaitingAfterPhase is required when phase is DONE"
      );
    }

    const cfg = normalizePomodoroConfig(running.configJson);
    const setIndex = running.setIndex ?? 1;
    const totalSets = running.totalSets ?? cfg.totalSets;

    // 最終セットのFOCUS完了後は、advanceしても何もしない（DONE待機のまま）
    if (awaiting === "FOCUS" && setIndex === totalSets) {
      // ただし「この操作は処理済み」として記録は残す（冪等のため）
      try {
        await this.prisma.timerAdvanceRequest.create({
          data: { clientRequestId, timerSessionId: running.id },
        });
      } catch (e) {
        if (!isPrismaUniqueError(e)) throw e;
      }

      return {
        state: "RUNNING",
        sessionId: running.id,
        subjectId: running.subjectId,
        startedAt: running.startedAt,
        serverNow: serverNow.toISOString(),
        mode: "POMODORO",
        phase: "DONE",
        setIndex,
        totalSets,
        phaseEndsAt: running.phaseEndsAt ? new Date(running.phaseEndsAt).toISOString() : null,
        remainingSec: 0,
        progress01: 1,
        pomodoroDone: true,
        awaitingAfterPhase: "FOCUS",
        advanced: false,
        clientRequestId,
      };
    }

    // 次フェーズ決定
    let nextPhase = null;
    let nextSetIndex = setIndex;

    if (awaiting === "FOCUS") {
      if (cfg.breakMin > 0) {
        nextPhase = "BREAK";
        nextSetIndex = setIndex; // 同セット内の休憩
      } else {
        nextPhase = "FOCUS";
        nextSetIndex = setIndex + 1; // 休憩なしで次セットへ
      }
    } else {
      // awaiting === "BREAK"
      nextPhase = "FOCUS";
      nextSetIndex = setIndex + 1;
    }

    if (nextSetIndex > totalSets) {
      // 安全側（DONEのまま）
      try {
        await this.prisma.timerAdvanceRequest.create({
          data: { clientRequestId, timerSessionId: running.id },
        });
      } catch (e) {
        if (!isPrismaUniqueError(e)) throw e;
      }

      return {
        state: "RUNNING",
        sessionId: running.id,
        subjectId: running.subjectId,
        startedAt: running.startedAt,
        serverNow: serverNow.toISOString(),
        mode: "POMODORO",
        phase: "DONE",
        setIndex,
        totalSets,
        phaseEndsAt: running.phaseEndsAt ? new Date(running.phaseEndsAt).toISOString() : null,
        remainingSec: 0,
        progress01: 1,
        pomodoroDone: true,
        awaitingAfterPhase: "FOCUS",
        advanced: false,
        clientRequestId,
      };
    }

    const durationSec = nextPhase === "BREAK" ? cfg.breakMin * 60 : cfg.focusMin * 60;
    const phaseStartedAt = serverNow;
    const phaseEndsAt = addSeconds(serverNow, durationSec);

    // ★B4: 「request記録」と「TimerSession更新」をできるだけ近づける（最低限の一貫性）
    // 1) requestを先に作る（同一IDの二重処理をここで防ぐ）
    // 2) その後 TimerSession を更新
    let updated;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        await tx.timerAdvanceRequest.create({
          data: { clientRequestId, timerSessionId: running.id },
        });

        return tx.timerSession.update({
          where: { id: running.id },
          data: {
            phase: nextPhase,
            setIndex: nextSetIndex,
            totalSets,
            phaseStartedAt,
            phaseEndsAt,
            awaitingAfterPhase: null,
          },
        });
      });
    } catch (e) {
      if (isPrismaUniqueError(e)) {
        // 同じIDが先に処理されてた → NO-OPで現状返す
        const current = await new GetCurrentTimerUseCase(this.prisma).execute();
        return {
          ...current,
          advanced: false,
          clientRequestId,
        };
      }
      throw e;
    }

    return {
      state: "RUNNING",
      sessionId: updated.id,
      subjectId: updated.subjectId,
      startedAt: updated.startedAt,
      serverNow: serverNow.toISOString(),
      mode: "POMODORO",
      phase: updated.phase,
      setIndex: updated.setIndex,
      totalSets: updated.totalSets,
      phaseEndsAt: phaseEndsAt.toISOString(),
      remainingSec: durationSec,
      progress01: 0,
      pomodoroDone: false,
      awaitingAfterPhase: null,
      advanced: true,
      clientRequestId,
    };
  }
}

module.exports = { AdvanceTimerUseCase };
