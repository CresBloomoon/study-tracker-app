// backend/src/domain/time.js

function roundUpMinutes(durationSec) {
  if (!Number.isFinite(durationSec) || durationSec < 0) return 0;
  return Math.ceil(durationSec / 60);
}

// YYYY-MM-DD の超軽バリデーション（厳密日付チェックは必要なら後で）
function isYyyyMmDd(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * JST日付(YYYY-MM-DD)を、UTCの [start, end) 範囲に変換する
 * - startUtc = JST 00:00 -> UTC 15:00 (前日)
 * - endUtc   = startUtc + 24h
 */
function jstDateToUtcRange(dateStr) {
  const startUtc = new Date(`${dateStr}T00:00:00+09:00`);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}

/** Date(UTC) -> JST日付キー YYYY-MM-DD */
function toJstDateKey(d) {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/** JSTの 00:00 (日付境界) を UTC Date として返す */
function startOfJstDay(d) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  j.setUTCHours(0, 0, 0, 0); // JST 0:00 を UTC表現で作る
  return new Date(j.getTime() - 9 * 60 * 60 * 1000);
}

/** JST基準で日数を足す（d を JSTカレンダーとして +n日） */
function addJstDays(d, n) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  j.setUTCDate(j.getUTCDate() + n);
  return new Date(j.getTime() - 9 * 60 * 60 * 1000);
}

// 月曜始まり or 日曜始まり（設定で切替可能）
function startOfJstWeek(d, { weekStartsOn = "MON" } = {}) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const day = j.getUTCDay(); // 0:日 1:月 ...

  let diff;
  if (weekStartsOn === "SUN") {
    diff = day; // 日=0, 月=1 ... 土=6
  } else {
    diff = (day + 6) % 7; // 月=0, 日=6
  }

  j.setUTCDate(j.getUTCDate() - diff);
  j.setUTCHours(0, 0, 0, 0);
  return new Date(j.getTime() - 9 * 60 * 60 * 1000);
}

/** 週の終端 [from, to) の to を返す（= +7日） */
function endOfJstWeekExclusive(fromDate) {
  return addJstDays(fromDate, 7);
}

/** 表示用 JST日付キー */
function formatJstDateKey(d) {
  return toJstDateKey(d);
}

/** 「今日」のJST日範囲を [startUtc, endUtc) で返す */
function getJstTodayRange(now = new Date()) {
  return jstDateToUtcRange(toJstDateKey(now));
}

/**
 * "YYYY-MM-DD" <-> Date（@db.Date 列用。タイムゾーンを持たない暦日として扱う）
 */
function parsePlainDate(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function formatPlainDate(d) {
  return d.toISOString().slice(0, 10);
}

module.exports = {
  roundUpMinutes,
  isYyyyMmDd,
  jstDateToUtcRange,
  toJstDateKey,
  startOfJstDay,
  addJstDays,
  startOfJstWeek,
  endOfJstWeekExclusive,
  formatJstDateKey,
  parsePlainDate,
  formatPlainDate,
  getJstTodayRange,
};
