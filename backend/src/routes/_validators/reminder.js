// backend/src/routes/_validators/reminder.js

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateCreateReminder(req, res, next) {
  const { title, dueAt, subjectId, subjectTaskId } = req.body;

  // title
  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "title is required",
    });
  }

  if (title.length > 200) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "title is too long (max 200)",
    });
  }

  // dueAt
  if (typeof dueAt !== "string") {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "dueAt must be string",
    });
  }

  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "dueAt must be valid datetime string",
    });
  }

  // subjectId（任意）
  if (subjectId !== undefined) {
    if (typeof subjectId !== "string" || !UUID_REGEX.test(subjectId)) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "subjectId must be UUID",
      });
    }
  }

  // subjectTaskId（任意）
  if (subjectTaskId !== undefined && subjectTaskId !== null) {
    if (typeof subjectTaskId !== "string" || !UUID_REGEX.test(subjectTaskId)) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "subjectTaskId must be UUID",
      });
    }
  }

  next();
}

module.exports = {
  validateCreateReminder,
};
