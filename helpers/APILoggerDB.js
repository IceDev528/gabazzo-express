if (process.env.NODE_ENV !== "production") require("dotenv").config();

let mongoose = require("mongoose");
let log = require("./log");
const url = process.env.API_LOGGER_DB;

exports.connect = () => {
  // connect the main DB
  let options = {
    reconnectInterval: 10000,
    reconnectTries: 60,
    useNewUrlParser: true,
  };
  let db = mongoose.createConnection(url, options);
  db.on("error", function (err) {
    // If first connect fails because mongod is down, try again later.
    // This is only needed for first connect, not for runtime reconnects.
    // See: https://github.com/Automattic/mongoose/issues/5169
    log(new Date(), String(err));
    // Wait for a bit, then try to connect again
    setTimeout(function () {
      log(db.readyState);
      if (db.readyState !== 0 || db.readyState !== 3) {
        log("CONNECTED");
      } else {
        db.openUri(url, options).catch((error) => {
          log(new Date(), String(error));
        });
      }
      // Why the empty catch?
      // Well, errors thrown by db.open() will also be passed to .on('error'),
      // so we can handle them there, no need to log anything in the catch here.
      // But we still need this empty catch to avoid unhandled rejections.
    }, 60 * 1000);
  });
  db.on("disconnected", () => {
    setTimeout(function () {
      log(db.readyState);
      if (db.readyState < 3 && db.readyState > 0) {
        log("CONNECTED");
      } else {
        db.openUri(url, options).catch((err) => {
          log(new Date(), String(err));
        });
      }
      // Why the empty catch?
      // Well, errors thrown by db.open() will also be passed to .on('error'),
      // so we can handle them there, no need to log anything in the catch here.
      // But we still need this empty catch to avoid unhandled rejections.
    }, 60 * 1000);
  });
  db.on(`open`, function () {
    // we`re connected!
    log(`API Logger DB Connected`);
    log(
      `###########################################################################`
    );
  });
  return db;
};
