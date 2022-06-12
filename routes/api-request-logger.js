let express = require("express");
const config = require("../config/index");
const serverMessages = require("../common/messages");
const { requestLogsMiddleware } = require("../common/request-logs-middleware");

module.exports = (app, db, models, dependencies) => {
  let router = express.Router();

  app.use(requestLogsMiddleware(models)); // middleware to log requests

  app.use(
    `/api`,
    (req, res, next) => {
      // registering /api prefix for all the app routes
      if (db.main.readyState !== 0) {
        next();
      } else {
        return next({
          message: "Server Error",
          data: null,
        });
      }
    },
    router
  );
};
