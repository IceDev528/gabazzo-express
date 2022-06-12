const User = require("../models/users");

module.exports = {
  asyncErrorHandler: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },

  checkIfUserExists: async (req, res, next) => {
    let emailExists = await User.findOne({ email: req.body.email });
    let usernameExists = await User.findOne({ username: req.body.username });

    if (emailExists) {
      req.session.error = "Email already exists";
      console.log("Email already exists");
      return res.redirect("back");
    } else if (usernameExists) {
      req.session.error = "Username already exists";
      console.log("Username already exists");
      return res.redirect("back");
    }
    next();
  },

  isLoggedIn: (req, res, next) => {
    if (req.isAuthenticated()) return next();
    // console.log('You need to be logged in to do that');
    req.session.redirectTo = req.originalUrl;
    req.session.error = "You need to be logged in to do that";
    res.redirect("/login");
  },

  isNotLoggedIn: (req, res, next) => {
    if (!req.isAuthenticated()) return next();
    // console.log('You need to be logged in to do that');
    req.session.redirectTo = req.originalUrl;
    req.session.error = "You are already logged in";
    res.redirect("/");
  },

  goToAccountSecurity: async (req, res, next) => {
    let user = req.user;
    if (user.about && user.serviceCategory) return next();
    req.session.error = "You Need To Complete This Form First";
    return res.redirect("/company-sign-up2");
  },

  goToPayment: async (req, res, next) => {
    let user = req.user;
    if (user.isEmailVerified) return next();
    req.session.error = "You Need To Verify Your Email Before Proceeding";
    return res.redirect("/company-sign-up4");
  },

  isCompany: async (req, res, next) => {
    let user = req.user;
    if (user.isCompany) return next();
    req.session.error = "You don't have permission to view that page";
    return res.redirect("back");
  },

  isNotCompany: async (req, res, next) => {
    let user = req.user;
    if (!user.isCompany) return next();
    req.session.error = "You don't have permission to view that page";
    return res.redirect("back");
  },

  isMember: async (req, res, next) => {
    let user = req.user;
    if (!user.isCompany) return next();
    req.session.error = "You don't have permission to view that page";
    return res.redirect("back");
  },

  isValidPassword: async (req, res, next) => {
    const { user } = await User.authenticate()(
      req.user.username,
      req.body.currentPassword
    );
    if (user) {
      // add user to res.locals
      res.locals.user = user;
      next();
    } else {
      req.session.error = "Incorrect Password";
      // console.log("Incorrect Password");
      return res.redirect("/company-settings/security");
    }
  },

  changePassword: async (req, res, next) => {
    const { newPassword, passwordConfirmation, currentPassword } = req.body;
    const { user } = res.locals;

    if (currentPassword === newPassword) {
      req.session.error =
        "Current Password and new Password must be different.";
      return res.redirect("back");
    } else {
      if (newPassword === passwordConfirmation) {
        await user.setPassword(newPassword);
        await user.save();
        next();
      } else {
        req.session.error = "The password and confirm password must match!";

        return res.redirect("/company-settings/security");
      }
    }
  },

  isEmailVerified: async (req, res, next) => {
    let user = req.user;
    if (user.isEmailVerified) return next();
    if (user.isCompany) {
      req.session.error = "You Need To Verify Your Email Before Proceeding";
      return res.redirect("/company-sign-up4");
    } else if (!user.isCompany) {
      req.session.error =
        "You Need To Verify Your Email Before Proceeding: Check Mail for a verification link";
      return res.redirect("/");
    }
  },

  isRegistered: async (req, res, next) => {
    let user = req.user;
    if (!user.about) return next();
    req.session.error = "Already Done with that page";
    return res.redirect("/");
  },
};
