const fs = require("fs");
const moment = require("moment");
const AWS = require("aws-sdk");
const config = require("../../config");

module.exports = (Models) => {
  const createDBCleanupArchiveDirectoryIfNotExists = async (
    dbCleanupDirectory
  ) => {
    const directoryFullPath = `${__dirname}/${dbCleanupDirectory}`;
    if (!fs.existsSync(directoryFullPath)) {
      await fs.mkdirSync(directoryFullPath);
    }
    return;
  };

  const backupSpecificModel = (
    modelName,
    dateRange,
    dbCleanupFilesDirectory
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cleanupResponseData = null;
        const removeDocumentsIds = [];
        const filePath = `${__dirname}/${dbCleanupFilesDirectory}/${modelName}-${moment(
          dateRange.start
        ).format("DD-MM-YYYY")}.log`;
        await fs.writeFileSync(`${filePath}`, "");
        const documentsFetchQuery = {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        };
        const cursor = Models[modelName].find(documentsFetchQuery).cursor();
        for (
          let doc = await cursor.next();
          doc !== null;
          doc = await cursor.next()
        ) {
          removeDocumentsIds.push(doc._id);
          await fs.appendFileSync(
            `${filePath}`,
            `${moment(doc.createdAt).format(
              "hh:mm:ss a DD-MM-YYYY"
            )} - ${JSON.stringify(doc)}\n`
          );
        }
        if (removeDocumentsIds.length > 0) {
          cleanupResponseData = {
            model: modelName,
            removeDocumentsIds,
          };
        }
        resolve(cleanupResponseData);
      } catch (err2) {
        reject(err2);
      }
    });
  };
  const removeAllDBCleanupFiles = (dbCleanupFilesDirectory) => {
    return new Promise((resolve, reject) => {
      fs.readdir(`${__dirname}/${dbCleanupFilesDirectory}`, (err, files) => {
        if (err) {
          reject(err);
        } else {
          for (const file of files) {
            if (file !== "example.log") {
              fs.unlink(
                `${__dirname}/${dbCleanupFilesDirectory}/${file}`,
                (err) => {
                  if (err) {
                    reject(err);
                  }
                }
              );
            }
          }
          resolve();
        }
      });
    });
  };
  const uploadDBCleanupFilesToS3 = async (zippedFileName) => {
    let s3 = new AWS.S3({});
    const cleanupFile = await fs.readFileSync(`${__dirname}/${zippedFileName}`);
    const s3UploadParams = {
      Bucket: config.s3.dbBackupBucket,
      Key: zippedFileName,
      Body: cleanupFile,
    };
    return s3.putObject(s3UploadParams).promise();
  };
  const removeDBCleanupZipFile = (zippedFileName) => {
    return fs.unlinkSync(`${__dirname}/${zippedFileName}`);
  };
  const removeDocumentsFromDB = (databaseCleanupData) => {
    const $promises = [];
    for (let i = 0; i < databaseCleanupData.length; i++) {
      $promises.push(
        Models[databaseCleanupData[i].model].remove({
          _id: { $in: databaseCleanupData[i].removeDocumentsIds },
        })
      );
    }
    return Promise.all($promises);
  };

  return {
    createDBCleanupArchiveDirectoryIfNotExists,
    backupSpecificModel,
    removeAllDBCleanupFiles,
    uploadDBCleanupFilesToS3,
    removeDBCleanupZipFile,
    removeDocumentsFromDB,
  };
};
