const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    job: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    google: {
      id: String,
      token: String,
      name: String,
      email: String,
    },
    facebook: {
      id: String,
      token: String,
      name: String,
      email: String,
    },
    firstName: String,
    lastName: String,
    username: String,
    email: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phoneNumber: String,
    profilePicture: String,
    profilePictureId: String,
    logo: String,
    logoId: String,
    about: String,
    slogan: String,
    service: String,
    serviceCategory: String,
    isFacebookVerified: { type: Boolean, default: false },
    isGoogleVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isCompany: { type: Boolean, default: false },
    verifyToken: String,
    verifyTokenExpires: Date,
    filters: [String],
    levels: [String],
    language: String,
    companyName: String,
    facebookUrl: { type: String, default: "" },
    twitterUrl: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    pinterestUrl: { type: String, default: "" },
    directions: String,
    videoUrl: String,
    videoId: String,
    sliderPhotos: [{ url: String, public_id: String }],
    videos: [{ url: String, public_id: String }],
    location: String,
    coordinates: Array,
    website: String,
    slogan: String,
    productsUsed: [String],
    tags: [String],
    noOfEmployees: String,
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    certificates: [
      {
        type: Schema.Types.ObjectId,
        ref: "Certificate",
      },
    ],
    employees: [
      {
        type: Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    faqs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Faq",
      },
    ],
    portfolios: [
      {
        type: Schema.Types.ObjectId,
        ref: "Portfolio",
      },
    ],
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    services: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    yearsInBusiness: String,
    areasOfExpertise: [String],
    serviceAreas: [String],
    productsUsed: [String],
    paymentMethod: {
      type: Object,
    },
    offlineSpan: String,
    isOffline: Boolean,
    offlineSpanTo: String,
    offlineSpanFrom: String,
    isFinancingAvailable: Boolean,
    entityType: String,
    isStateLicensed: Boolean,
    stateLicense: {
      licenseNo: String,
      licenseState: String,
      licenseExpiration: String,
      file: {
        key: String,
        path: String,
      },
    },
    isInsured: Boolean,
    insurance: {
      insuranceExpiration: String,
      insuranceCovered: String,
      insuranceNo: String,
      insuranceCompany: String,
      insuranceState: String,
      file: {
        key: String,
        path: String,
      },
    },
    isBonded: Boolean,
    bond: {
      bondState: String,
      bondInfo: String,
      file: {
        key: String,
        path: String,
      },
    },
    mondayFrom: String,
    mondayTo: String,
    tuesdayFrom: String,
    tuesdayTo: String,
    wednesdayFrom: String,
    wednesdayTo: String,
    thursdayFrom: String,
    thursdayTo: String,
    fridayFrom: String,
    fridayTo: String,
    saturdayFrom: String,
    saturdayTo: String,
    sundayFrom: String,
    sundayTo: String,
    Purpose: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    averageReview: String,
    notes: String,
    reminder: String,
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    list: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: { type: Boolean, default: true },
    status: { type: Boolean, default: false },
    loggedOut: Date,
    activateToken: String,
    activateExpires: Date,
    securityQuestion: { question: String, answer: String },
    liked: { type: Number, default: 0 },
    billing: {
      billTo: {
        name: String,
        companyName: String,
        location: String,
        phoneNumber: String,
        email: String,
        country: String,
        city: String,
        zipCode: String,
      },
      deliverTo: {
        type: [
          {
            name: String,
            companyName: String,
            location: String,
            phoneNumber: String,
            email: String,
          },
        ],
        default: [],
      },
    },
    conversations: [
      {
        type: Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],
  },
  { timestamps: true }
);

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
