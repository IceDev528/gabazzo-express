const express = require("express");
const router = express.Router();
const multer = require("multer");
const passport = require("passport");
const validators = require("../validation/index");
const imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|oog)$/i)) {
    return cb(new Error("Only image and video files are allowed!"), false);
  }
  cb(null, true);
};

// FILE FILTER
const messageAttachmentFilter = function (req, file, cb) {
  if (file.originalname.match(/\.(exe|bin)$/i)) {
    return cb(new Error("Executabale files are not allowed to send."), false);
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

const upload = multer({ storage: storage, fileFilter: imageFilter });

const messageAttachment = multer({
  storage: storage,
  fileFilter: messageAttachmentFilter,
});

const {
  getViewRequest,
  getUpdatePortfolio,
  getPortfolioForm,
  getFilterUpdate,
  getUpdateService,
  getUserBilling,
  putUserBilling,
  postMessage,
  getHomePage,
  postSignUp,
  postLogin,
  getLogout,
  getSignup,
  getLogin,
  getPartnership,
  postPartnership,
  getCompanySignUp,
  postCompanySignUp,
  getCompanySignUp2,
  postCompanySignUp2,
  getCompanySignUp3,
  getCompanySignUp4,
  postCompanySignUp4,
  getCompanySignUp5,
  getVerify,
  getCompanyDashboard,
  getSellerOverview,
  getSellerDo,
  getSellerDoNot,
  getSellerOverview2,
  userUpdate,
  getAbout,
  getCovidInfo,
  getJobsAndOpportunities,
  getTechnologyOpportunities,
  getApplyFullStackDeveloper,
  getPressAndNews,
  getGabazzoCrowdFundingCampaign,
  getAboutDigipaid,
  getTrustMembers,
  getStudyBuyer,
  getMemberRankingSystem,
  getSellerLeagueSystem,
  getInvestorRelations,
  getPatronage,
  getPatronageChiefOfficers,
  getPatronageMexicoRelations,
  getInvestorContactUs,
  getInvestorEmailAlerts,
  getInvestorFaqs,
  getWhistleblowerHotline,
  getEventsAndPresentations,
  getEmployees,
  getServices,
  getPortfolio,
  getProducts,
  getFaq,
  getMedia,
  getContactUs,
  postContactUs,
  getReviews,
  putAbout,
  postJourney,
  putJourney,
  deleteJourney,
  postCertificate,
  putCertificate,
  deleteCertificate,
  putProfilePicture,
  putLogo,
  postMediaPhoto,
  putMediaPhoto,
  deleteMediaPhoto,
  postMediaVideo,
  putMediaVideo,
  deleteMediaVideo,
  postEmployee,
  putEmployee,
  deleteEmployee,
  postPortfolio,
  putPortfolio,
  deletePortfolio,
  postService,
  putService,
  deleteService,
  postProduct,
  putProduct,
  deleteProduct,
  postFaq,
  putFaq,
  deleteFaq,
  companyProfileShow,
  companyProfileAbout,
  companyProfileMedia,
  companyProfileEmployee,
  companyProfilePortfolio,
  companyProfileServices,
  companyProfileReviews,
  serviceDetails,
  productDetails,
  companyProfileFaq,
  getMemberProfile,
  companyContact,
  search,
  createReview,
  reviewReply,
  getForgotPw,
  putForgotPw,
  getReset,
  putReset,
  getAboutUs,
  getBlogSingle,
  getBlog,
  getCookiePolicy,
  getHelpBuyer,
  getHelpSeller,
  getHowBusiness,
  getHowMember,
  getPress,
  getPrivacyPolicy,
  postPrivacyPolicy,
  getSiteMap,
  getTerms,
  getIntellectual,
  getSafetyBuyer,
  getSafetySeller,
  getCompanySignUpHome,
  getAccount,
  getBilling,
  getNotifications,
  getPayment,
  getSecurity,
  putAccount,
  putEmailAccount,
  putSecurity,
  likes,
  unlike,
  saveToList,
  removeFromList,
  getProfile,
  putProfile,
  activateAccount,
  deactivateAccount,
  getSavedListItems,
  getSavedList,
  putSecurityQuestion,
  putBilling,
  createList,
  deleteList,
  getOtherListItems,
  removeCompanyFromList,
  defaultList,
  getInbox,
  getCreateServices,
  postServicePortFormOne,
  getServicePortSecondForm,
  getSearchPage,
  postServicePortSecondForm,
  postSearchPage,
  postUserNote,
  postUserReminder,
  createLabel,
  saveToLabel,
  saveStateLicence,
  addCommentReply,
  saveInsuranceLicense,
  saveBondLicense,
  getResolutionCenterForm,
  getDisputedSubmittedPage,
  postResolutionCenterForm,
  getResolutionCenterFormContractor,
  postResolutionCenterFormContractor,
} = require("../controllers");
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
} = require("../middleware");
const {
  getMyOffers,
  getSingleOffer,
  getOrderDetailsSinglePaymentPage,
  getConfirmAndSinglePay,
} = require("../controllers/offer/offer");
const {
  createJob,
  getMyJobs,
  getSingleJob,
  getSubmitRequirementsSinglePaymentPage,
  addDescription,
  addDescriptionCustomer,
  changeStatus,
  getMangeOrderPage,
  remindLater,
  getReviewPage,
  createReviewJob,
  extendDeadLine,
  createPaypalCharge,
} = require("../controllers/job/job");
const {
  getActivity,
  sendMessageActivity,
  addTrackingInfo,
  addMaterialRecieptTracker,
  getActivityPage,
  getTrackingPage,
  getRequirementsPage,
  getPdfFilesPage,
} = require("../controllers/activity/activity");

/* GET home page. */
router.get("/", asyncErrorHandler(getHomePage));

/* GET about-us. */
router.get("/about-us", asyncErrorHandler(getAboutUs));

/* GET blog-single-post. */
router.get("/blog-single-post", asyncErrorHandler(getBlogSingle));

/* GET blog. */
router.get("/blog", asyncErrorHandler(getBlog));

/* GET contact-us. */
router.get("/contact-us", asyncErrorHandler(getContactUs));

/* POST contact-us. */
router.post("/contact-us", asyncErrorHandler(postContactUs));

/* GET cookie-policy. */
router.get("/cookie-policy", asyncErrorHandler(getCookiePolicy));

/* GET help-center-buyer. */
router.get("/help-center-buyer", asyncErrorHandler(getHelpBuyer));

/* GET help-center-seller. */
router.get("/help-center-seller", asyncErrorHandler(getHelpSeller));

/* GET how-it-works-business-owner. */
router.get("/how-it-works-business-owner", asyncErrorHandler(getHowBusiness));

/* GET how-it-works-member. */
router.get("/how-it-works-members", asyncErrorHandler(getHowMember));

/* GET press-and-news. */
router.get("/press-and-news", asyncErrorHandler(getPress));

/* GET privacy-policy. */
router.get("/privacy-policy", asyncErrorHandler(getPrivacyPolicy));

/* POST privacy-Policy. */
router.post("/privacy-policy", asyncErrorHandler(postPrivacyPolicy));

/* GET Covid-Info. */
router.get("/covid-info", asyncErrorHandler(getCovidInfo));

/* GET Jobs-and-Opportunities. */

router.get(
  "/jobs-and-opportunities",
  asyncErrorHandler(getJobsAndOpportunities)
);

/* GET technology-opportunities. */
router.get(
  "/technology-opportunities",
  asyncErrorHandler(getTechnologyOpportunities)
);

/* GET apply-full-stack-developer. */
router.get(
  "/apply-full-stack-developer",
  asyncErrorHandler(getApplyFullStackDeveloper)
);

router.get(
  "/jobs-and-opportunities",
  asyncErrorHandler(getJobsAndOpportunities)
);

/* GET Press-and-News. */
router.get("/press-and-news", asyncErrorHandler(getPressAndNews));

/* GET Article-Investor Relations-Crowd Funding Campgain. */

router.get(
  "/crowdfunding-campaign",
  asyncErrorHandler(getGabazzoCrowdFundingCampaign)
);

/* GET About Digipaid. */
router.get("/about-digipaid", asyncErrorHandler(getAboutDigipaid));

router.get(
  "/crowdfunding-campaign",
  asyncErrorHandler(getGabazzoCrowdFundingCampaign)
);

/* GET Partnership. */
router.get("/partnerships", asyncErrorHandler(getPartnership));

/* POST Partnership. */
router.post("/partnerships", asyncErrorHandler(postPartnership));

/* GET site-map. */
router.get("/site-map", asyncErrorHandler(getSiteMap));

/* GET safety-for-members. */
router.get("/safety-for-members", asyncErrorHandler(getSafetyBuyer));

/* GET safety-for-contractors. */
router.get("/safety-for-contractors", asyncErrorHandler(getSafetySeller));

/* GET terms-and-conditions. */
router.get("/terms-and-conditions", asyncErrorHandler(getTerms));

/* GET intellectual-property-claims. */
router.get("/intellectual-property-claims", asyncErrorHandler(getIntellectual));

/* GET trust-and-safety-members. */
router.get("/trust-and-safety-members", asyncErrorHandler(getTrustMembers));

/* GET study-buyer. */
router.get("/study-buyer", asyncErrorHandler(getStudyBuyer));

/* GET seller-league-levels. */
router.get("/seller-league-system", asyncErrorHandler(getSellerLeagueSystem));

/* GET ranking-system-members. */
router.get(
  "/ranking-system-members",
  asyncErrorHandler(getMemberRankingSystem)
);

/* GET investor-relations. */
router.get("/investor-relations", asyncErrorHandler(getInvestorRelations));

/* GET investor-contact-us. */
router.get("/investor-contact-us", asyncErrorHandler(getInvestorContactUs));

/* GET investor-email-alerts. */
router.get("/investor-email-alerts", asyncErrorHandler(getInvestorEmailAlerts));

/* GET investor-faqs. */
router.get("/investor-faqs", asyncErrorHandler(getInvestorFaqs));

/* GET patronage. */
router.get("/patronage", asyncErrorHandler(getPatronage));

/* GET patronage-chief-officers. */
router.get(
  "/patronage-chief-officers",
  asyncErrorHandler(getPatronageChiefOfficers)
);

/* GET patronage-mexico-relations. */
router.get(
  "/patronage-mexico-relations",
  asyncErrorHandler(getPatronageMexicoRelations)
);

/* GET whistleblower-hotline. */
router.get(
  "/whistleblower-hotline",
  asyncErrorHandler(getWhistleblowerHotline)
);

/* GET events-and-presentations. */

router.get(
  "/events-and-presentations",
  asyncErrorHandler(getEventsAndPresentations)
);

router.get(
  "/events-and-presentations",
  asyncErrorHandler(getEventsAndPresentations)
);

/* POST search. */
router.post("/pages", search);

/* GET seller-overview */
router.get("/become-a-seller-overview", getSellerOverview);

/* GET seller-overview */
router.get("/become-a-seller-overview-do", getSellerDo);

/* GET seller-overview */
router.get("/become-a-seller-overview-do-not", getSellerDoNot);

/* GET seller-overview */
// router.get("/become-a-seller-overview2", getSellerOverview2);

/* GET sign-up */
router.get("/sign-up", isNotLoggedIn, getSignup);

/* POST /sign-up */
router.post("/sign-up", checkIfUserExists, asyncErrorHandler(postSignUp));

/* GET company-sign-up1 */
router.get("/company-sign-up-home", asyncErrorHandler(getCompanySignUpHome));

/* GET company-sign-up1 */
router.get("/company-sign-up", checkIfUserExists, getCompanySignUp);

/* POST /company-sign-up */
router.post(
  "/company-sign-up",
  checkIfUserExists,
  upload.single("profilePicture"),
  asyncErrorHandler(postCompanySignUp)
);

/* GET company-sign-up2 */
router.get("/company-sign-up2", isLoggedIn, isRegistered, getCompanySignUp2);

/* POST /company-sign-up2 */
router.post(
  "/company-sign-up2",
  isLoggedIn,
  isRegistered,
  upload.single("logo"),
  asyncErrorHandler(postCompanySignUp2)
);

/* GET company-sign-up2 */
router.get("/company-sign-up3", isLoggedIn, getCompanySignUp3);

/* GET company-sign-up4 */
router.get("/company-sign-up4", isLoggedIn, getCompanySignUp4);

/* POST /company-sign-up4 */
router.post(
  "/company-sign-up4",
  isLoggedIn,
  asyncErrorHandler(postCompanySignUp4)
);

/* GET /verify */
router.get("/verify/:token", isLoggedIn, asyncErrorHandler(getVerify));

/* GET company-sign-up5 */
router.get(
  "/company-sign-up5",
  isEmailVerified,
  goToPayment,
  getCompanySignUp5
);

/* GET /dashboard */
router.get("/member-profile/:id", isLoggedIn, getMemberProfile);

/* GET /dashboard */
router.get(
  "/company-dashboard",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  getCompanyDashboard
);

/* PUT /dashboard/:user_id */
router.put(
  "/dashboard",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  messageAttachment.single("logo"),
  asyncErrorHandler(userUpdate)
);

/* GET /login */
router.get("/login", isNotLoggedIn, getLogin);

/* POST /login */
router.post("/login", postLogin);

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  function (req, res) {
    console.log("sucess route called");
    res.redirect("/");
  }
);

router.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/login",
  }),
  function (req, res) {
    console.log("sucess route called");
    res.redirect("/");
  }
);

/* GET /logout */
router.get("/logout", isLoggedIn, getLogout);

/* GET /dashboard/about */
router.get(
  "/company-dashboard/about",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getAbout)
);

/* POST /journey */
router.post(
  "/journey",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(postJourney)
);

/* PUT /journey */
router.put(
  "/journey/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(putJourney)
);

/* DELETE /journey */
router.delete(
  "/journey/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(deleteJourney)
);

/* POST /certificate */
router.post(
  "/certificate",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.single("image"),
  asyncErrorHandler(postCertificate)
);

/* PUT /certificate */
router.put(
  "/certificate/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.single("image"),
  asyncErrorHandler(putCertificate)
);

/* Delete /certificate */
router.delete(
  "/certificate/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(deleteCertificate)
);

/* PUT /dashboard/about */
router.put(
  "/dashboard/about",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(upload.array("video", 6)),
  asyncErrorHandler(putAbout)
);

/* PUT /logo */
router.put(
  "/logo",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.single("logo"),
  asyncErrorHandler(putLogo)
);

/* PUT /profile-picture */
router.put(
  "/profile-picture",
  isLoggedIn,
  isEmailVerified,
  upload.single("profilePicture"),
  asyncErrorHandler(putProfilePicture)
);

/* GET /dashboard/employees */
router.get(
  "/company-dashboard/employees",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  getEmployees
);

/* POST /employee */
router.post(
  "/employee",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.single("image"),
  asyncErrorHandler(postEmployee)
);

/* PUT /employee */
router.put(
  "/employee/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.single("image"),
  asyncErrorHandler(putEmployee)
);

/* Delete /employee */
router.delete(
  "/employee/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(deleteEmployee)
);

/* GET /dashboard/faq */
router.get(
  "/company-dashboard/faq",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getFaq)
);

/* POST /faq */
router.post(
  "/faq",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(postFaq)
);

/* PUT /portfolio */
router.put(
  "/faq/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(putFaq)
);

/* Delete /portfolio */
router.delete(
  "/faq/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(deleteFaq)
);

/* GET /dashboard/media */
router.get(
  "/company-dashboard/media",
  isCompany,
  isEmailVerified,
  isLoggedIn,
  asyncErrorHandler(getMedia)
);

/* POST /media-photo */
router.post(
  "/media-photo",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.single("image"),
  asyncErrorHandler(postMediaPhoto)
);

/* PUT /media-photo */
router.put(
  "/media-photo/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(putMediaPhoto)
);

/* Delete /media-photo */
router.delete(
  "/media-photo/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(deleteMediaPhoto)
);

/* POST /media-video */
router.post(
  "/media-video",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.single("video"),
  asyncErrorHandler(postMediaVideo)
);

/* PUT /media-video */
router.put(
  "/media-video/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(putMediaVideo)
);

/* Delete /media-video */
router.delete(
  "/media-video/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(deleteMediaVideo)
);

/* GET /dashboard/portfolio */
router.get(
  "/company-dashboard/portfolio",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getPortfolio)
);

/* POST /portfolio */
router.post(
  "/portfolio",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.array("images"),
  asyncErrorHandler(postPortfolio)
);

/* PUT /portfolio */
router.put(
  "/portfolio/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.array("images"),
  asyncErrorHandler(putPortfolio)
);

/* Delete /portfolio */
router.delete(
  "/portfolio/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(deletePortfolio)
);

/* GET /dashboard/products */
router.get(
  "/company-dashboard/products",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getProducts)
);

/* POST /products */
router.post(
  "/products",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.array("images"),
  asyncErrorHandler(postProduct)
);

/* PUT /products */
router.put(
  "/products/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.array("images"),
  asyncErrorHandler(putProduct)
);

/* Delete /products */
router.delete(
  "/products/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(deleteProduct)
);

/* GET /dashboard/reviews */
router.get(
  "/company-dashboard/reviews",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getReviews)
);

/* GET /dashboard/reviews */
router.post(
  "/company-dashboard/reviews",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getReviews)
);

/* PUT /review */
router.put(
  "/review/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(reviewReply)
);

/* GET /dashboard/services */
router.get(
  "/company-dashboard/services",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getServices)
);

/* GET /dashboard/updateservice */
router.get(
  "/company-dashboard/updateservice/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getUpdateService)
);

/* GET /dashboard/services */
router.get(
  "/company-dashboard/createservice",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getCreateServices)
);

/* POST /services */
router.post(
  "/services",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.array("images"),
  asyncErrorHandler(postService)
);

/* PUT /services */
router.put(
  "/services/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.array("images"),
  validators.validate("putServices"),
  asyncErrorHandler(putService)
);

/* Delete /services */
router.delete(
  "/services/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(deleteService)
);

// COMPANY SETTINGS

/* GET /company-settings/account */
router.get(
  "/company-settings/account",
  isLoggedIn,
  asyncErrorHandler(getAccount)
);

/* PUT /company-settings/account */
router.put(
  "/company-settings/account",
  isLoggedIn,
  asyncErrorHandler(putAccount)
);

/* PUT /company-settings/EmailAccount */
router.put(
  "/company-settings/emailaccount",
  isLoggedIn,
  checkIfUserExists,
  asyncErrorHandler(putEmailAccount)
);

/* GET /company-settings/billing */
router.get(
  "/company-settings/billing",
  isLoggedIn,
  isCompany,
  asyncErrorHandler(getBilling)
);

router.get(
  "/company-settings/userbilling",
  isLoggedIn,
  asyncErrorHandler(getUserBilling)
);

router.put(
  "/company-settings/userbilling",
  isLoggedIn,
  asyncErrorHandler(putUserBilling)
);

// /* GET /company-settings/company-info */
// router.get('/company-settings/company-info', isLoggedIn, isCompany, asyncErrorHandler(getCompanyInfo));

/* GET /company-settings/notifications */
router.get(
  "/company-settings/notifications",
  isLoggedIn,
  asyncErrorHandler(getNotifications)
);

/* GET /company-settings/payment */
router.get(
  "/company-settings/payment",
  isLoggedIn,
  isCompany,
  asyncErrorHandler(getPayment)
);

/* GET /company-settings/security */
router.get(
  "/company-settings/security",
  isLoggedIn,
  asyncErrorHandler(getSecurity)
);

/* PUT /company-settings/security */
router.put(
  "/company-settings/security",
  isLoggedIn,
  isEmailVerified,
  asyncErrorHandler(isValidPassword),
  asyncErrorHandler(changePassword),
  asyncErrorHandler(putSecurity)
);

/* GET /company-settings/profile */
router.get(
  "/company-settings/profile",
  isLoggedIn,
  isNotCompany,
  asyncErrorHandler(getProfile)
);

/* PUT /profile */
router.put(
  "/profile",
  isLoggedIn,
  isNotCompany,
  upload.single("profilePicture"),
  asyncErrorHandler(putProfile)
);

//SHOW PAGES
/* GET company-profile */
router.get("/company-profile/:id", asyncErrorHandler(companyProfileShow));

// POST /company-contact
router.post("/company-contact", asyncErrorHandler(companyContact));

/* GET company-profile/about */
router.get(
  "/company-profile/:id/about",
  asyncErrorHandler(companyProfileAbout)
);

/* GET company-profile/media */
router.get(
  "/company-profile/:id/media",
  asyncErrorHandler(companyProfileMedia)
);

/* GET company-profile/employee */
router.get(
  "/company-profile/:id/employees",
  asyncErrorHandler(companyProfileEmployee)
);

/* GET /dashboard/portfolio */
router.get(
  "/company-dashboard/createportfolio",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getPortfolioForm)
);

/* GET /dashboard/updateportfolio */
router.get(
  "/company-dashboard/updateportfolio/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getUpdatePortfolio)
);

/* GET company-profile/portfolio */
router.get(
  "/company-profile/:id/portfolio",
  asyncErrorHandler(companyProfilePortfolio)
);

/* GET company-profile/reviews */
router.get(
  "/company-profile/:id/reviews",
  asyncErrorHandler(companyProfileReviews)
);
router.post(
  "/company-profile/:id/reviews",
  asyncErrorHandler(companyProfileReviews)
);

/* POST /reviews */
router.post(
  "/create-review/:id",
  isLoggedIn,
  upload.array("images"),
  asyncErrorHandler(createReview)
);

/* GET company-profile/services-products */
router.get(
  "/company-profile/:id/services-products",
  asyncErrorHandler(companyProfileServices)
);

/* GET service*/
router.get("/service/:id", asyncErrorHandler(serviceDetails));

/* GET product*/
router.get("/product/:id", asyncErrorHandler(productDetails));

/* GET company-profile/faq */
router.get("/company-profile/:id/faq", asyncErrorHandler(companyProfileFaq));

/* GET forgot */
router.get("/forgot-password", getForgotPw);

/* PUT forgot */
router.put("/forgot-password", asyncErrorHandler(putForgotPw));

/* GET /reset/:token */
router.get("/reset/:token", asyncErrorHandler(getReset));

/* PUT /reset/:token */
router.put("/reset/:token", asyncErrorHandler(putReset));

/* POST /likes/:id */
router.post("/likes/:id", isLoggedIn, asyncErrorHandler(likes));

/* POST /unlike/:id */
router.post("/unlike/:id", isLoggedIn, asyncErrorHandler(unlike));

/* POST /save-to-list/:id */
router.post(
  "/save-to-list/:companyId/:listId",
  isLoggedIn,
  isNotCompany,
  asyncErrorHandler(saveToList)
);

/* POST /save-to-list/:id */
router.post(
  "/default-list/:companyId",
  isLoggedIn,
  isNotCompany,
  asyncErrorHandler(defaultList)
);

/* POST /remove-from-list/:id */
router.delete(
  "/remove-from-list/:id",
  isLoggedIn,
  isNotCompany,
  asyncErrorHandler(removeFromList)
);

/* De-activate account */
router.put("/deactivate", isLoggedIn, asyncErrorHandler(deactivateAccount));

/* GET Activate account */
router.get("/activate/:token", asyncErrorHandler(activateAccount));

/* POST /likes/:id */
router.post("/create-list", isLoggedIn, asyncErrorHandler(createList));

/* Delete /delete-list */
router.delete("/delete-list/:id", isLoggedIn, asyncErrorHandler(deleteList));

/* Delete /delete-list */
router.delete(
  "/remove-company/:companyId/:listId",
  isLoggedIn,
  asyncErrorHandler(removeCompanyFromList)
);

/* GET /saved-list-item */
router.get(
  "/saved-list-item",
  isLoggedIn,
  isNotCompany,
  asyncErrorHandler(getSavedListItems)
);

/* GET /other-lists */
router.get(
  "/other-lists/:id",
  isLoggedIn,
  isNotCompany,
  asyncErrorHandler(getOtherListItems)
);

/* GET /saved-list*/
router.get(
  "/saved-list",
  isLoggedIn,
  isNotCompany,
  asyncErrorHandler(getSavedList)
);

/* Security Question */
router.put(
  "/security-question",
  isLoggedIn,
  asyncErrorHandler(putSecurityQuestion)
);

/* Billing info*/
router.put("/billing-info", isLoggedIn, asyncErrorHandler(putBilling));

/* GET Inbox */
router.get("/inbox/:id", isLoggedIn, asyncErrorHandler(getInbox));

/* Send a message */
router.post(
  "/message/:id",
  isLoggedIn,
  messageAttachment.array("attachments", 12),
  asyncErrorHandler(postMessage)
);

router.post(
  "/serviceport",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  upload.array("images"),
  asyncErrorHandler(postServicePortFormOne)
);

router.get(
  "/filterconfiguration/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getServicePortSecondForm)
);

router.post(
  "/filterconfiguration/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(postServicePortSecondForm)
);

/* GET /dashboard/updateservice */
router.get(
  "/updatefilter/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getFilterUpdate)
);

router.get("/search", asyncErrorHandler(getSearchPage));

router.post("/user/note", asyncErrorHandler(postUserNote));

router.post("/user/reminder", isLoggedIn, asyncErrorHandler(postUserReminder));

router.post("/add-label", isLoggedIn, asyncErrorHandler(createLabel));

router.post(
  "/save-to-label/:companyId/:labelId",
  isLoggedIn,
  asyncErrorHandler(saveToLabel)
);

router.post(
  "/state-license/:id",
  messageAttachment.single("state-doc"),
  asyncErrorHandler(saveStateLicence)
);
router.post(
  "/insurance-certificate/:id",
  messageAttachment.single("insurance-doc"),
  asyncErrorHandler(saveInsuranceLicense)
);
router.post(
  "/bonded/:id",
  messageAttachment.single("bond-doc"),
  asyncErrorHandler(saveBondLicense)
);

// OFFERS
router.get(
  "/user/get-offers",
  isLoggedIn,
  isEmailVerified,
  asyncErrorHandler(getMyOffers)
);
router.get(
  "/company/get-offers",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getMyOffers)
);
router.get(
  "/user/get-offer/:id",
  isLoggedIn,
  isEmailVerified,
  asyncErrorHandler(getSingleOffer)
);
router.get(
  "/company/get-offer/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getSingleOffer)
);

// JOB
router.post(
  "/user/payment-job",
  isLoggedIn,
  // isEmailVerified,
  createJob
);
//paypal
router.post(
  "/user/payment-job-paypal",
  isLoggedIn,
  // isEmailVerified,
  createPaypalCharge
);
router.post(
  "/user/add-desc",
  isLoggedIn,
  // isEmailVerified,
  addDescription
);
router.post(
  "/company/add-desc",
  isLoggedIn,
  // isEmailVerified,
  addDescriptionCustomer
);
router.post(
  "/user/change-status",
  isLoggedIn,
  // isEmailVerified,
  changeStatus
);
router.post(
  "/company/change-status",
  isLoggedIn,
  // isEmailVerified,
  changeStatus
);
router.get(
  "/user/remind-later/:id",
  isLoggedIn,
  // isEmailVerified,
  remindLater
);
router.get(
  "/user/get-jobs",
  isLoggedIn,
  isEmailVerified,
  asyncErrorHandler(getMyJobs)
);
router.get(
  "/company/get-jobs",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getMyJobs)
);
router.get(
  "/user/get-job/:id",
  isLoggedIn,
  isEmailVerified,
  asyncErrorHandler(getSingleJob)
);
router.get(
  "/company/get-job/:id",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getSingleJob)
);
router.post(
  "/user/save-review",
  isLoggedIn,
  isMember,
  // isEmailVerified,
  asyncErrorHandler(createReviewJob)
);
router.post(
  "/user/extend",
  isLoggedIn,
  isMember,
  // isEmailVerified,
  asyncErrorHandler(extendDeadLine)
);

// ACTIVITY
router.get(
  "/user/get-activity/:job",
  isLoggedIn,
  isEmailVerified,
  asyncErrorHandler(getActivity)
);
router.get(
  "/company/get-activity/:job",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(getActivity)
);
router.post(
  "/user/send-message-activity",
  isLoggedIn,
  // isEmailVerified,
  asyncErrorHandler(sendMessageActivity)
);
router.post(
  "/company/send-message-activity",
  isLoggedIn,
  asyncErrorHandler(sendMessageActivity)
);
router.post(
  "/company/add-tracking-info",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(addTrackingInfo)
);
router.post(
  "/company/add-material-reciept",
  isLoggedIn,
  isCompany,
  isEmailVerified,
  asyncErrorHandler(addMaterialRecieptTracker)
);

//get order details single payment page
router.get(
  "/order-details-single-payment-page/:id",
  isLoggedIn,
  isMember,
  asyncErrorHandler(getOrderDetailsSinglePaymentPage)
);

//get single confirm and pay page
router.get(
  "/confirm-and-single-pay/:id",
  isLoggedIn,
  isMember,
  asyncErrorHandler(getConfirmAndSinglePay)
);

//get single submit requirements and payment page
router.get(
  "/submit-work-requirements-single-payment/:id",
  isLoggedIn,
  isMember,
  asyncErrorHandler(getSubmitRequirementsSinglePaymentPage)
);

//get single submit requirements and payment page
router.get("/manage-orders", isLoggedIn, asyncErrorHandler(getMangeOrderPage));

//get activity page
router.get("/activity/:id", isLoggedIn, asyncErrorHandler(getActivityPage));

//get tracking page
router.get("/tracking/:id", isLoggedIn, asyncErrorHandler(getTrackingPage));

//get requirements page
router.get(
  "/requirements/:id",
  isLoggedIn,
  asyncErrorHandler(getRequirementsPage)
);

//get pdffiles page
router.get("/pdffiles/:id", isLoggedIn, asyncErrorHandler(getPdfFilesPage));

//get pdffiles page
router.get(
  "/review/:id",
  isLoggedIn,
  isMember,
  asyncErrorHandler(getReviewPage)
);

router.post(
  "/add-comment-reply/:id",
  isLoggedIn,
  isCompany,
  asyncErrorHandler(addCommentReply)
);

//resolution center user POV
router.get(
  "/resolution-center/:id",
  isLoggedIn,
  isMember,
  asyncErrorHandler(getResolutionCenterForm)
);

router.post(
  "/resolution-center-data",
  isLoggedIn,
  isMember,
  asyncErrorHandler(postResolutionCenterForm)
);

router.get(
  "/dispute-submitted",
  isLoggedIn,
  isMember,
  asyncErrorHandler(getDisputedSubmittedPage)
);

//resolution center contractor POV

router.get(
  "/resolution-center-contractor/:id",
  isLoggedIn,
  // isCompany,
  // isMember,
  asyncErrorHandler(getResolutionCenterFormContractor)
);

router.post(
  "/resolution-center-data-contractor",
  isLoggedIn,
  // isCompany,
  // isMember,
  asyncErrorHandler(postResolutionCenterFormContractor)
);
module.exports = router;
