// backend/src/domain/subjectTaskProgress.js
const { addJstDays, toJstDateKey } = require("./time");

const PACE_LOOKBACK_DAYS = 14;

const PACE_STATUS = {
  NO_REMINDERS: "NO_REMINDERS",
  COMPLETE: "COMPLETE",
  NO_PACE_DATA: "NO_PACE_DATA",
  ON_TRACK: "ON_TRACK",
  DELAYED: "DELAYED",
};

/**
 * 直近14日間の消化ペース（1日あたり平均完了数）から残りの完了見込み日を逆算し、
 * SubjectTask.endDateと比較して順調/遅延を判定する。
 * - Reminderが1件も紐付いていない -> NO_REMINDERS（「完了」と誤読されないよう区別する）
 * - 残件数0（1件以上あって全て完了） -> COMPLETE
 * - 直近14日間の完了実績が0 -> ペース算出不可のためNO_PACE_DATA（遅延扱いにはしない）
 */
function computeSubjectTaskProgress({ doneCount, totalCount, recentlyCompletedCount, endDate, now = new Date() }) {
  if (totalCount === 0) {
    return { estimatedFinishDate: null, paceStatus: PACE_STATUS.NO_REMINDERS };
  }

  const remainingCount = Math.max(totalCount - doneCount, 0);

  if (remainingCount === 0) {
    return { estimatedFinishDate: null, paceStatus: PACE_STATUS.COMPLETE };
  }

  const averagePerDay = recentlyCompletedCount / PACE_LOOKBACK_DAYS;
  if (averagePerDay <= 0) {
    return { estimatedFinishDate: null, paceStatus: PACE_STATUS.NO_PACE_DATA };
  }

  const estimatedDays = Math.ceil(remainingCount / averagePerDay);
  const estimatedFinishDateKey = toJstDateKey(addJstDays(now, estimatedDays));
  const endDateKey = toJstDateKey(endDate);

  const paceStatus = estimatedFinishDateKey <= endDateKey ? PACE_STATUS.ON_TRACK : PACE_STATUS.DELAYED;

  return { estimatedFinishDate: estimatedFinishDateKey, paceStatus };
}

module.exports = { computeSubjectTaskProgress, PACE_STATUS, PACE_LOOKBACK_DAYS };
