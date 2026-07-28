// backend/src/domain/pomodoro.js

function clamp01(x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return x;
  }
  
  function toInt(v, fallback) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.trunc(n);
  }
  
  /**
   * POMODORO の「今」を計算する（DB更新はしない）
   *
   * ルール：
   * - 1セット = FOCUS -> BREAK（breakMin=0 なら BREAK をスキップ）
   * - totalSets セット終わったら DONE（ただしセッション自体は RUNNING のまま。止めるのはユーザーの Stop）
   * - setIndex は 1-based
   */
  function computePomodoroState({ startedAt, serverNow, config }) {
    const focusMin = Math.max(0, toInt(config?.focusMin, 25));
    const breakMin = Math.max(0, toInt(config?.breakMin, 5));
    const totalSets = Math.max(1, toInt(config?.totalSets, 3));
  
    const focusSec = focusMin * 60;
    const breakSec = breakMin * 60;
  
    const startMs = new Date(startedAt).getTime();
    const nowMs = new Date(serverNow).getTime();
    const elapsedSecRaw = Math.floor((nowMs - startMs) / 1000);
    const elapsedSec = Math.max(0, elapsedSecRaw);
  
    // 全体のタイムライン（BREAK が 0 のときはスキップ）
    // 例: totalSets=3, breakMin>0 なら (FOCUS+BREAK)×(totalSets-1) + FOCUS（最後に休憩は無し扱いにする）
    // でも「最後にもBREAKを入れたい」派が後で出ても変えやすいように、ここは明示しておく。
    const hasBreak = breakSec > 0;
  
    // セットごとに「FOCUS -> (BREAK)」を回す。ただし最後セットの後の BREAK は入れない設計。
    const setCycleSec = focusSec + (hasBreak ? breakSec : 0);
    const totalDurationSec = setCycleSec * (totalSets - 1) + focusSec;
  
    // DONE 判定
    if (elapsedSec >= totalDurationSec) {
      const doneAt = new Date(startMs + totalDurationSec * 1000).toISOString();
      return {
        phase: "DONE",
        setIndex: totalSets,
        totalSets,
        phaseEndsAt: doneAt,
        remainingSec: 0,
        progress01: 1,
        pomodoroDone: true,
      };
    }
  
    // いま何セット目か（1-based）
    // 最終セットの途中は setCycleSec で割ると totalSets-1 までに収まる
    const setIndex = Math.min(
      totalSets,
      1 + Math.floor(elapsedSec / setCycleSec)
    );
  
    const withinSetSec = elapsedSec - (setIndex - 1) * setCycleSec;
  
    // FOCUS中
    if (withinSetSec < focusSec || !hasBreak) {
      const phase = "FOCUS";
      const phaseElapsed = withinSetSec;
      const phaseLen = Math.max(1, focusSec); // 0除算回避
      const remainingSec = Math.max(0, focusSec - withinSetSec);
      const progress01 = clamp01(phaseElapsed / phaseLen);
  
      const phaseEndsAt = new Date(
        startMs +
          ((setIndex - 1) * setCycleSec + focusSec) * 1000
      ).toISOString();
  
      return {
        phase,
        setIndex,
        totalSets,
        phaseEndsAt,
        remainingSec,
        progress01,
        pomodoroDone: false,
      };
    }
  
    // BREAK中（breakSec > 0 のときのみここに来る）
    const phase = "BREAK";
    const breakElapsed = withinSetSec - focusSec;
    const phaseLen = Math.max(1, breakSec);
    const remainingSec = Math.max(0, breakSec - breakElapsed);
    const progress01 = clamp01(breakElapsed / phaseLen);
  
    const phaseEndsAt = new Date(
      startMs +
        ((setIndex - 1) * setCycleSec + focusSec + breakSec) * 1000
    ).toISOString();
  
    return {
      phase,
      setIndex,
      totalSets,
      phaseEndsAt,
      remainingSec,
      progress01,
      pomodoroDone: false,
    };
  }
  
  module.exports = { computePomodoroState };
  