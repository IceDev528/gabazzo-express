const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AvailableServicesSchema = new Schema({
  title: {
    type: String,
  },
  tagline: {
    type: String,
  },
  parent: {
    type: String,
  },

  metadata: {
    type: Object,
  },

  // This schema can be used if different services require different attributes
  // such as car may require mileage but home-items dont require mileage.
  // For now they all require mostly same attributes, so not much useful for now I guess.
  // For reference: https://vertabelo.com/blog/designing-an-online-classifieds-data-model/
  // The above url is for relation databases.
  attributes: [
    {
      attributeName: {
        type: String,
        required: true,
      },

      attributeUnit: {
        type: String,
      },

      isMandatory: {
        type: Boolean,
        default: false,
      },

      parentAttribute: String,

      screenControlObject: {
        type: String,
        enum: ["CHECK_BOX", "RADIO_BUTTON", "TEXT_BOX", "LABEL"],
        default: "CHECK_BOX",
      },

      possibleValues: [String],
    },
  ],
});

module.exports = mongoose.model("AvailableServices", AvailableServicesSchema);
