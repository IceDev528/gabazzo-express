let Boom = require("boom");
let ApiRequestLoggerCtrl = require("./api-request-logger.ctrl");
const moment = require("moment");
const ConfigsCtrl = require("../configs/configs.ctrl");
const { zipFolder } = require("../../common/zip-folder");

module.exports = (models) => {
  const apiRequestLoggerCtrl = ApiRequestLoggerCtrl(models);
  const dbBackupFilesDirectory = "db-backup-files";
  const configsCtrl = ConfigsCtrl(models);

  const backupLogsToS3 = async (req, res, next) => {
    try {
      let zippedFileName;
      try {
        // returning response to cron lambda
        res.json({
          data: {},
          message: "Successfully run api logs backup cron",
          success: true,
        });
        await apiRequestLoggerCtrl.createDBCleanupArchiveDirectoryIfNotExists(
          dbBackupFilesDirectory
        );
        const cronRunTime = moment();
        console.log(
          `Clean database cron run at: ${cronRunTime.format(
            "hh:mm a DD-MM-YYYY"
          )}`
        ); // added this log to track the cron execution
        const modelsToCleanup = ["ApiRequestLogger"]; // list of all models to cleanup
        const maxDocumentAvailabilityPeriod = 30; // document availability period
        const configs = await configsCtrl.getConfigs(); //fetch configs to get the last run time
        let apiRequestLogsBackupCronPointer =
          configs.apiRequestLogsBackupCronPointer ||
          moment()
            .subtract(maxDocumentAvailabilityPeriod + 1, "days")
            .toDate();
        let lastRunDifference = moment(new Date()).diff(
          apiRequestLogsBackupCronPointer,
          "days"
        );
        let dbCleanupDay = moment(apiRequestLogsBackupCronPointer).add(
          1,
          "days"
        ); // jump to next day for cron
        while (lastRunDifference > maxDocumentAvailabilityPeriod) {
          const databaseCleanupData = [];
          const cleanUpDateRange = {
            start: dbCleanupDay.startOf("day").toDate(), // get the start of cleanup day
            end: dbCleanupDay.endOf("day").toDate(), // get the end of cleanup day
          };
          console.log(
            `Date range: ${cleanUpDateRange.start} - ${cleanUpDateRange.end}`
          ); // added this log to track the date range
          for (let i = 0; i < modelsToCleanup.length; i++) {
            const cleanupDataResponse =
              await apiRequestLoggerCtrl.backupSpecificModel(
                modelsToCleanup[i],
                cleanUpDateRange,
                dbBackupFilesDirectory
              );
            if (cleanupDataResponse) {
              databaseCleanupData.push(cleanupDataResponse); // to save the delete documents details in array (will delete them after successfull .zip upload)
            }
          }
          zippedFileName = `${dbCleanupDay.format("YYYY-MM-DD")}.zip`;
          await zipFolder(
            `${__dirname}/${dbBackupFilesDirectory}`,
            `${__dirname}/${zippedFileName}`
          );
          await apiRequestLoggerCtrl.removeAllDBCleanupFiles(
            dbBackupFilesDirectory
          ); // to delete all the recently created db arhive log files
          await apiRequestLoggerCtrl.uploadDBCleanupFilesToS3(zippedFileName); // upload DB archive zip folder to s3
          await apiRequestLoggerCtrl.removeDBCleanupZipFile(zippedFileName); // delete the recently create zip file
          await apiRequestLoggerCtrl.removeDocumentsFromDB(databaseCleanupData); // delete document from database
          const configUpdate = {
            $set: {
              apiRequestLogsBackupCronPointer: dbCleanupDay.toDate(),
            },
          };
          // add this in loop to keep track of any code crash/arhieve fails
          await configsCtrl.updateConfigs(configUpdate); // to update databaseCleanupPointer after each day achieval
          lastRunDifference--;
          dbCleanupDay = dbCleanupDay.add(1, "days");
        }
        const apiRequestLogsBackupCleanupCronRunUpdateData = {
          $set: {
            apiRequestLogsBackupCleanupCronRun: cronRunTime.toDate(),
          },
        };
        await configsCtrl.updateConfigs(
          apiRequestLogsBackupCleanupCronRunUpdateData
        ); // to update the cron run time
      } catch (error) {
        // on error delte the created files
        await apiRequestLoggerCtrl.removeAllDBCleanupFiles(
          dbBackupFilesDirectory
        ); // to delete all the recently created db arhive log files
        if (zippedFileName) {
          await apiRequestLoggerCtrl.removeDBCleanupZipFile(zippedFileName); // delete the recently create zip file
        }
        return next(Boom.internal("Error running db backup cron", error));
      }
    } catch (error) {
      return next(Boom.badImplementation(error), error);
    }
  };

  return {
    backupLogsToS3,
  };
};
