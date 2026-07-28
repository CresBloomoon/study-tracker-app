// backend/src/domain/reminderPriority.js
// 「今日期限のものを先頭」の並び替えルール：TODAY -> OVERDUE -> FUTURE
const PRIORITY_TODAY = 0;
const PRIORITY_OVERDUE = 1;
const PRIORITY_FUTURE = 2;

function classifyDueness(dueAt, { startUtc, endUtc }) {
  if (dueAt >= startUtc && dueAt < endUtc) return PRIORITY_TODAY;
  if (dueAt < startUtc) return PRIORITY_OVERDUE;
  return PRIORITY_FUTURE;
}

// 期限超過の表示フラグ。自動先送りはしない（並び替え・表示のみに使う）
function isOverdue(dueAt, isDone, { startUtc }) {
  return !isDone && dueAt < startUtc;
}

module.exports = {
  PRIORITY_TODAY,
  PRIORITY_OVERDUE,
  PRIORITY_FUTURE,
  classifyDueness,
  isOverdue,
};
