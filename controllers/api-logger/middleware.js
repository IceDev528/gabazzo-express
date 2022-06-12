const geoip = require("geoip-lite");
const allowedRequestBody = ["POST", "PUT", "DELETE", "GET"];

exports.requestLogsMiddleware = (model) => {
  return (req, res, next) => {
    const json = res.json;
    const response = res;
    const initialTime = Date.now();

    try {
      const responseTime = Date.now();
      const logData = {
        request: {
          body: null,
          ipAddress: "",
          method: req.method,
          query: isEmptyObject(req.query) ? null : req.query,
          url: `${req.baseUrl}${req.path}`,
          headers: req.headers,
        },
        requestTime: initialTime,
        responseTime,
        requestDuration: responseTime - initialTime,
        response: {
          status: response.statusCode,
          headers: res._headers ? { ...res._headers } : null,
          body: null,
        },
        user: req.user || null,
        endpointFailure: response.statusCode >= 400,
      };

      if (allowedRequestBody.includes(req.method)) {
        // to restrict adding body to other request methods
        logData.request.body = req.body;
      }
      if (logData.request.headers && logData.request.headers.authorization) {
        logData.request.headers.authorization = "******";
      }
      if (req.headers["x-forwarded-for"]) {
        logData.request.ipAddress =
          req.headers["x-forwarded-for"].split(",")[0];
      } else if (req.connection && req.connection.remoteAddress) {
        logData.request.ipAddress = req.connection.remoteAddress;
      } else {
        logData.request.ipAddress = req.ip;
      }
      const geo = geoip.lookup(logData.request.ipAddress);
      if (geo && geo.ll) {
        // since geo gives ll in [latitude, longitude] format, which mongodb require it in [longitude, latitide] format https://docs.mongodb.com/manual/reference/geojson/#point
        geo.ll = geo.ll.reverse();
      }
      logData.location = geo || {};
      logData.response.body = res.body ? JSON.stringify(res.body) : null;
      logData.request.headers = logData.request.headers;
      if (
        req.originalUrl &&
        response.statusCode >= 200 &&
        response.statusCode <= 299
      ) {
        if (
          req.originalUrl &&
          (!req.originalUrl.includes("subscriptions") ||
            !req.originalUrl.includes("payment"))
        ) {
          logData.response.body = "--";
        }
      }
      model.create(logData);
    } catch (err) {
      console.log(err);
    }

    next();
  };
};

function isEmptyObject(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}
