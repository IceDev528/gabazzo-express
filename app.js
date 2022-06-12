if (process.env.NODE_ENV !== "production") require("dotenv").config();

var GoogleStrategy = require("passport-google-oauth20").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
const createError = require("http-errors");
const express = require("express");
const engine = require("ejs-mate");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const bodyParser = require("body-parser");
const passport = require("passport");
const expressSession = require("express-session");
const sessionMiddleware = expressSession({
  key: "connect.sid", // the name of the cookie where express/connect stores its session_id
  secret: "wow cool dude!",
  resave: true,
  saveUninitialized: true,
  store: new (require("connect-mongo")(expressSession))({
    url: process.env.mongoURI,
  }),
});
const fetch = require("node-fetch");
const cron = require("node-cron");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
var passportSocketIo = require("passport.socketio");
const sgMail = require("@sendgrid/mail");

// Routes
const index = require("./routes/index");
const leadRoutes = require("./routes/lead-system");

const User = require("./models/users");
const Job = require("./models/job");
const apiSearch = require("./routes/apiRoutes/search");

const {
  requestLogsMiddleware,
} = require("./controllers/api-logger/middleware");
const APILoggerDB = require("./helpers/APILoggerDB");

const app = express();

app.io = require("socket.io")();
//Sockets
var routes = require("./routes/socketRoute")(app.io);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//connect to the database
mongoose.connect(process.env.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("WE'RE CONNECTED!");
});

// use ejs-locals for all ejs templates:
app.engine("ejs", engine);
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// set public assets directory
app.use(express.static("public"));

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

// API LOGGER WORK
const logDB = {
  APILoggerDB: APILoggerDB.connect(), // connecting DB
};
const loggerModal = require("./models/log")(logDB.APILoggerDB); // initialing all the models in the database

app.use(requestLogsMiddleware(loggerModal)); // middleware to log requests

app.locals.moment = require("moment");

// Configure passport and sessions
app.use(sessionMiddleware);

// io.use(sharedsession(session));

app.use(passport.initialize());
app.use(passport.session());

//With Socket.io >= 1.0
app.io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser, // the same middleware you registrer in express
    key: "connect.sid", // the name of the cookie where express/connect stores its session_id
    secret: "wow cool dude!", // the session_secret to parse the cookie
    resave: true,
    saveUninitialized: true,
    store: new (require("connect-mongo")(expressSession))({
      url: process.env.mongoURI,
    }),
  })
);

passport.use(User.createStrategy());

//GOOGLE STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // callbackURL: "https://gabazzo.com/auth/google/callback",
      callbackURL: "http://localhost:3000/auth/google/callback",
      passReqToCallback: true,
    },
    async function (req, accessToken, refreshToken, profile, done) {
      try {
        const profileJson = profile._json;
        const userData = {
          username:
            profileJson.given_name.toLowerCase().replace(/\s+/g, "") +
            profileJson.family_name.toLowerCase().replace(/\s+/g, ""),
          firstName: profileJson.given_name,
          lastName: profileJson.family_name,
          email: profileJson.email,
          profilePicture: profileJson.picture ? profileJson.picture : null,
          isGoogleVerified: true,
          isEmailVerified: true,
          google: {
            id: profileJson.sub,
            token: accessToken,
            name: profileJson.given_name + " " + profileJson.family_name,
            email: profileJson.email,
          },
          about: "",
        };

        let existingUserData = await User.findOne({ email: userData.email });

        if (existingUserData) {
          existingUserData.username = userData.username;
          existingUserData.firstName = userData.firstName;
          existingUserData.lastName = userData.lastName;
          existingUserData.profilePicture = userData.profilePicture;
          existingUserData.google = userData.google;
          existingUserData.isGoogleVerified = userData.isGoogleVerified;
          existingUserData.isEmailVerified = userData.isEmailVerified;
          existingUserData.email = userData.email;

          existingUserData.save();

          done(null, existingUserData);
        } else {
          User.create(userData, function (err, docs) {
            if (err) done(err);
            else done(null, docs);
          });
        }
      } catch (err) {
        // console.log(err);
        done(err);
      }
    }
  )
);

function getFacebookProfileData(accessToken) {
  return new Promise(async (resolve, reject) => {
    try {
      fetch(
        `https://graph.facebook.com/me?fields=email,picture,link,first_name,last_name&access_token=${accessToken}`
      )
        .then((res) => res.json())
        .then((json) => {
          resolve(json);
        });
    } catch (error) {
      reject(error);
    }
  });
}

//FACEBOOK STRATEGY
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "https://gabazzo.com/auth/facebook/callback",
      // callbackURL: "http://localhost:3000/auth/facebook/callback",
      profileFields: ["email", "name", "profileUrl"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const userProfile = await getFacebookProfileData(accessToken);
        const userData = {
          username:
            userProfile.first_name.toLowerCase().replace(/\s+/g, "") +
            userProfile.last_name.toLowerCase().replace(/\s+/g, ""),
          email: userProfile.email,
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
          profilePicture:
            userProfile.picture && userProfile.picture.data
              ? userProfile.picture && userProfile.picture.data.url
              : null,
          isFacebookVerified: true,
          isEmailVerified: true,
          facebook: {
            id: profile.id,
            token: accessToken,
            name: userProfile.first_name + " " + userProfile.last_name,
            email: userProfile.email,
          },
          about: "",
        };

        const existingUserData = await User.findOne({ email: userData.email });

        if (existingUserData) {
          existingUserData.username = userData.username;
          existingUserData.firstName = userData.firstName;
          existingUserData.lastName = userData.lastName;
          existingUserData.profilePicture = userData.profilePicture;
          existingUserData.facebook = userData.facebook;
          existingUserData.isFacebookVerified = userData.isFacebookVerified;
          existingUserData.isEmailVerified = userData.isEmailVerified;
          existingUserData.email = userData.email;

          existingUserData.save();
          done(null, existingUserData);
        } else {
          User.create(userData, function (err, docs) {
            if (err) done(err);
            else done(null, docs);
          });
        }
      } catch (err) {
        // console.log(err);
        done(err);
      }
    }
  )
);

passport.serializeUser(function (account, done) {
  done(null, account.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, account) {
    done(err, account);
  });
});

// set local variables middleware
app.use(async function (req, res, next) {
  res.locals.total = await User.find({
    isEmailVerified: true,
    isCompany: true,
  }).exec();
  res.locals.members = await User.find({
    isEmailVerified: true,
    isCompany: false,
  }).count();
  res.locals.currentUser = req.user;
  res.locals.hostName = req.headers.host;
  // set default page title
  res.locals.title = "GABAZZO";
  // set success flash message
  res.locals.success = req.session.success || "";
  delete req.session.success;
  // set error flash message
  res.locals.error = req.session.error || "";
  delete req.session.error;
  // continue on to next function in middleware chain
  next();
});

// cron.schedule("* * * * *", async function () {
//   console.log("job");
//   const users = await User.find({
//     isOffline: true,
//     offlineSpanTo: {
//       $lte: moment().utc().tz("America/Chicago").format("YYYY-MM-DD HH:mm"),
//     },
//   });

//   console.log("user", users);
// });

// Mount Routes
app.use("/", index);
app.use(leadRoutes);

// app.use('/users', usersRouter);

app.use(routes);
app.use("/api", apiSearch);

cron.schedule("* * * * *", async () => {
  // console.log("sending email reminders");
  try {
    const jobs = await Job.find({
      remind_later: true,
      next_reminder: { $lte: new Date() },
    }).populate("buyer", "email google facebook");
    await Promise.all(
      jobs.map(async (job) => {
        const msg = {
          to: "",
          from: "Gabazzo <no-reply@gabazzo.com>",
          subject: "Gabazzo - Reminder To Add a Job Description",
          template_id: "d-3a8aecf5cfed4160b5b6c4ad1a8ab1a7",
          dynamic_template_data: { username: user.username },
        };
        if (job.buyer.email) {
          msg.to = job.buyer.email;
        } else if (job.buyer.google && job.buyer.google.email) {
          msg.to = job.buyer.google.email;
        } else if (job.buyer.facebook && job.buyer.facebook.email) {
          msg.to = job.buyer.facebook.email;
        }
        let today = new Date();
        job.next_reminder = today.setHours(today.getHours() + 16);
        await job.save();
        await sgMail.send(msg);
      })
    );
  } catch (err) {
    console.log("ERR: ", err);
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  try {
    next(createError(404));
  } catch (err) {
    console.log(err);
  }
});

// error handler
app.use(function (err, req, res, next) {
  console.log(err);
  if (err.message !== "Not Found") req.session.error = err.message;
  res.redirect("back");
});


module.exports = app;
