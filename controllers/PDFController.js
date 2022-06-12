const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const lambda = new AWS.Lambda({
  apiVersion: "2015-03-31",
  region: "eu-central-1",
});

// Creates a new Lambda function.
exports.createFunction = (params) => {
  return new Promise((resolve, reject) => {
    lambda.createFunction(params, function (err, data) {
      if (err) reject(err);
      // an error occurred
      else resolve(data); // successful response
    });
  });
};
// Fetch the particular lambda function.
exports.getFunction = (params) => {
  return new Promise((resolve, reject) => {
    lambda.getFunction(params, function (err, data) {
      if (err) {
        reject(err);
      } else resolve(data);
    });
  });
};
// Updates the code of lambda function.
exports.updateFunctionCode = (params) => {
  return new Promise((resolve, reject) => {
    lambda.updateFunctionCode(params, function (err, data) {
      if (err) {
        reject(err);
      } else resolve(data);
    });
  });
};
// Deletes the lambda function.
exports.deleteFunction = (params) => {
  return new Promise((resolve, reject) => {
    lambda.deleteFunction(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
exports.invokeFunction = (params) => {
  return new Promise((resolve, reject) => {
    lambda.invoke(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
/**
 *   var params = {
    FunctionName: 'STRING_VALUE', required
    InvokeArgs: Buffer.from('...') || 'STRING_VALUE' || streamObject required
  };
 */
exports.invokeFunctionAsync = (params) => {
  return new Promise((resolve, reject) => {
    lambda.invokeAsync(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
