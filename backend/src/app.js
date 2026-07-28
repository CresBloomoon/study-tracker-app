const express = require("express");
const { healthRouter } = require("./routes/health.routes");
const { studyLogRouter } = require("./routes/studyLog.routes");
const { timerRouter } = require("./routes/timer.routes");
const { ApiError, isApiError } = require("./domain/errors");
const { subjectsRouter } = require("./routes/subjects.routes");
const { dashboardRouter } = require("./routes/dashboard.routes");
const { remindersRouter } = require("./routes/reminders.routes");
const { reportRouter } = require("./routes/report.routes");
const { milestonesRouter } = require("./routes/milestones.routes");
const { subjectTasksRouter } = require("./routes/subjectTasks.routes");
const { reviewRecipesRouter } = require("./routes/reviewRecipes.routes");
const { reviewSeriesRouter } = require("./routes/reviewSeries.routes");

function createApp() {
  const app = express();
  app.use(express.json());

  app.use("/api", healthRouter());
  app.use("/api", studyLogRouter());
  app.use("/api", timerRouter());
  app.use("/api", subjectsRouter());
  app.use("/api/dashboard", dashboardRouter());
  app.use("/api", remindersRouter());
  app.use("/api/report", reportRouter());
  app.use("/api", milestonesRouter());
  app.use("/api", subjectTasksRouter());
  app.use("/api", reviewRecipesRouter());
  app.use("/api", reviewSeriesRouter());

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Not Found" } });
  });

  // error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (isApiError(err)) {
      res.status(err.status).json({ error: { code: err.code, message: err.message } });
      return;
    }
    console.error(err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
  });

  return app;
}

module.exports = { createApp };
