const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});
const fs = require("fs");

const S3 = new AWS.S3();

// Upload to S3
exports.uploadToS3 = (file) => {
  try {
    const fileStream = fs.readFileSync(file.path);
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: fileStream,
      Key: file.filename,
    };

    return new Promise((resolve, reject) => {
      S3.upload(params, (error, data) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      });
    });
  } catch (err) {
    return Promise.reject(err);
  }
};

// Delete file from S3
exports.deleteFileFromS3 = (key) => {
  try {
    const deleteParams = {
      Key: key,
      Bucket: process.env.AWS_BUCKET_NAME,
    };

    return new Promise((resolve, reject) => {
      S3.deleteObject(deleteParams, (error, data) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      });
    });
  } catch (err) {
    return Promise.reject(err);
  }
};

//download file from s3 bucket
exports.getFileFromS3 = (key) => {
  const downloadParams = {
    Key: key,
    Bucket: process.env.AWS_BUCKET_NAME,
  };
  return S3.getObject(downloadParams).createReadStream();
};
