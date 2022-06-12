let mongoose = require("mongoose");

module.exports = (db) => {
  let Schema = mongoose.Schema;
  let ApiRequestLogger = new Schema(
    {
      createdAt: { type: Date, expires: 2764800 }, // document will expire and removed after 2764800 seconds ( 32 days )
      user: new Schema({}, { strict: false }),
      response: new Schema({}, { strict: false }),
      request: new Schema({}, { strict: false }),
      requestTime: {
        type: Date,
        default: Date.now(),
      },
      responseTime: {
        type: Date,
        default: Date.now(),
      },
      requestDuration: {
        type: Number,
        default: null,
      },
      endpointFailure: {
        type: Boolean,
        default: false,
      },
      location: {
        range: Array,
        country: String,
        region: String,
        eu: String,
        timezone: String,
        city: String,
        ll: {
          index: "2dsphere",
          type: [Number],
        },
        metro: Number,
        area: Number,
      },
    },
    { timestamps: true }
  );
  ApiRequestLogger.index(
    {
      "request.url": 1,
      "user._id": 1,
      "user.email": 1,
      createdAt: 1,
    },
    { text: true }
  );
  return db.model(`ApiRequestLogger`, ApiRequestLogger);
};
