const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PortfolioSchema = new Schema({
  title: String,
  category: String,
  service: String,
  description: String,
  images: [{ url: String, public_id: String }],
  startTime: String,
  endTime: String,
  budget: String,
  teamMembers: String,
  expertise: String,
  products: String,
  city: String,
  state: String,
  owner: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
  },
});

module.exports = mongoose.model("Portfolio", PortfolioSchema);
