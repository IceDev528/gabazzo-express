const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OfferSchema = new Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    // this field is specific if the offer is send to a project
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    // This field is used to identify if the offer is placed on the project or it is send by using chat system
    offerType: {
      type: String,
      enum: ["projectoffer", "normaloffer"],
      required: true,
      default: "normaloffer",
    },
    type: {
      type: String,
      enum: ["singlepayment", "milestonepayment"],
      required: true,
    },
    pdf: {
      type: String,
    },
    tasks: {
      type: Array,
      default: [],
    },
    invoiceNo: Number,
    tax: Number,
    discount: Number,
    subTotal: Number,
    totalCost: Number,
    notes: String,
    revision: Number,
    totalDuration: Number,
    status: {
      type: String,
      enum: ["accepted", "withdrawn", "declined"],
    },
    receiverAddress: {
      name: String,
      companyName: String,
      location: String,
      phoneNumber: String,
      email: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", OfferSchema);
