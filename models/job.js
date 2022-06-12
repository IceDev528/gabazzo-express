const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const JobSchema = new Schema(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    type: {
      type: String,
      enum: ["singlepayment", "milestonepayment"],
      required: true,
    },
    // Single Payment Offer
    task: [
      {
        description: String,
        qty: Number,
        unitprice: Number,
        total: Number,
      },
    ],
    // Milestone Payment Offer
    milestone: [
      {
        description: String,
        qty: Number,
        deliverydate: Date,
        unitprice: Number,
        total: Number,
      },
    ],
    offer: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },
    description: String,
    isActive: Boolean,
    finaldeliverydate: Date,
    payment_intent: String,
    charge_object: Object,
    card_holder_name: String,
    status: {
      type: String,
      required: true,
      enum: [
        "Incomplete",
        "Missing Details",
        "Awaiting Review",
        "Delivered",
        "Completed",
        "Cancelled",
      ],
    },
    starting_time: Date,
    completion_time: Date,
    job_images: Array,
    answer1: Boolean,
    answer2: Boolean,
    answer3: Boolean,
    remind_later: {
      type: Boolean,
      default: false,
    },
    next_reminder: Date,
    review: {
      ratings: Number,
      review: String,
    },
    messages: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        message: {
          type: String,
        },
        attachments: Array,
        createdAt: Date,
      },
    ],
    receiptNo: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
