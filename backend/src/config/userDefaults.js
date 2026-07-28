// backend/src/config/userDefaults.js
function defaultWeekStartsOn() {
  return process.env.WEEK_STARTS_ON === "SUN" ? "SUN" : "MON";
}

function defaultWeeklyMode() {
  // CALENDAR_WEEK: 月〜日（or 日〜土）固定の週
  // LAST_7_DAYS: 直近7日
  return process.env.WEEKLY_MODE === "LAST_7_DAYS" ? "LAST_7_DAYS" : "CALENDAR_WEEK";
}

module.exports = {
  defaultWeekStartsOn,
  defaultWeeklyMode,
};
