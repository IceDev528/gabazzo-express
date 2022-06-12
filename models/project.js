const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProjectSchema = new Schema(
  {
    owner: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      profilePicture: String,
      username: String,
      name: String,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    title: {
      required: true,
      type: String,
    },
    address: String,
    location: {
      type: {
        type: String,
        enum: ["Point"], // 'location.type' must be 'Point'
        required: true,
      },
      coordinates: {
        type: [Number], // Note that longitude comes first in a GeoJSON coordinate array, not latitude.
        required: true,
      },
    },
    budget: {
      type: String,
    },
    isOpenToBid: {
      default: false,
      type: Boolean,
    },
    mainCategory: {
      required: true,
      type: String,
    },
    subCategory: {
      required: true,
      type: String,
    },
    type: {
      required: true,
      type: String,
    },
    language: {
      required: true,
      type: String,
    },
    date: {
      required: true,
      type: String,
    },
    time: {
      required: true,
      type: String,
    },
    description: {
      required: true,
      type: String,
    },
    media: [{ key: String, path: String }],
    // The sentoffers field will contain the username of those companies who send the offers - It is used in view leads system
    sentoffers: [],
  },
  { timestamps: true }
);

ProjectSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Project", ProjectSchema);
