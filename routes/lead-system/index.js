const express = require("express");
const router = express.Router();
const multer = require("multer");

// FILE FILTER
const attachmentFilter = function (req, file, cb) {
  if (file.originalname.match(/\.(exe|bin)$/i)) {
    return cb(new Error("Executabale files are not allowed to send."), false);
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: attachmentFilter,
});

const {
  asyncErrorHandler,
  checkIfUserExists,
  isLoggedIn,
  goToAccountSecurity,
  goToPayment,
  isCompany,
  isMember,
  changePassword,
  isValidPassword,
  isNotCompany,
  isEmailVerified,
  isRegistered,
  isNotLoggedIn,
} = require("../../middleware");

const {
  getViewRequest,
  postProject,
  deleteOffer,
  deleteProject,
  changeProjectStatus,
  getViewLead,
  postOfferLead,
  getViewOffer,
} = require("../../controllers/lead-system");

/**
 * Lead System Routes
 */

router.get(
  "/view-request",
  isLoggedIn,
  isNotCompany,
  asyncErrorHandler(getViewRequest)
);

// Pause the project
router.post(
  "/view-request/:id",
  isLoggedIn,
  isNotCompany,
  asyncErrorHandler(changeProjectStatus)
);

// Delete the project
router.delete(
  "/view-request/:id",
  isLoggedIn,
  isNotCompany,
  asyncErrorHandler(deleteProject)
);

router.post(
  "/post-project",
  isLoggedIn,
  isNotCompany,
  upload.array("attachments"),
  asyncErrorHandler(postProject)
);

router.get("/view-lead", asyncErrorHandler(getViewLead));

router.post("/post-offer-lead", asyncErrorHandler(postOfferLead));

router.get("/view-offer/:id", asyncErrorHandler(getViewOffer));

router.delete("/view-offer/:id", asyncErrorHandler(deleteOffer));

module.exports = router;
