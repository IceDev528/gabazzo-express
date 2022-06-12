const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  tracking_info: [
    {
      files: Array,
      progress: Number,
      description: String,
      createdAt: Date,
    },
  ],
  reciepts: [
    {
      company_details: {
        company_name: String,
        company_address: String,
        reciept_number: String,
        rebate_number: String,
        date: Date,
      },
      other_details: {
        state_tax: Number,
        discount: Number,
      },
      description: [
        {
          name: String,
          quantity: Number,
          cost: Number,
        },
      ],
      sub_total: Number,
      totalCost: Number,
      tax: Number,
    },
  ],
  progress: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Activity", ActivitySchema);
