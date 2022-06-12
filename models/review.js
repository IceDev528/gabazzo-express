const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReviewSchema = new Schema(
  {
    text: String,
    reply: String,
    images: [{ url: String, public_id: String }],
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
    // Author is the writer of the review - It's the member
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      username: String,
      profilePicture: String,
      name: String,
    },
    // Contractor - The one who gets the review
    owner: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      username: String,
      logo: String,
      name: String,
    },
    rating: Number,
    sharingPermision: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", ReviewSchema);
