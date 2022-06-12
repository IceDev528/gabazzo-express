const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServiceSchema = new Schema({
  title: String,
  priceFrom: String,
  priceTo: String,
  description: String,
  category: String,
  filter: {
    type: Object,
  },
  subCategories: [String],
  languages: [String],
  paymentMethodsAccepted: [String],
  propertyTypes: [String],
  images: [{ url: String, public_id: String }],
  owner: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
  },
  time: String,
  teamMembers: String,
  products: String,
  tags: [String],
  serviceType: String,
  priceInfo: String,
  teamInfo: String,
});

module.exports = mongoose.model("Service", ServiceSchema);
