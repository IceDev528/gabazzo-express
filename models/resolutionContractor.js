const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ResolutionContractorSchema = new Schema({
    sender: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
      },
    
      receiver: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
      },
      offer:{
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offer",
      }
    },
    
    mainReason:{
    },
    
    subReasons: {},
    
    details: {},

    heading: {},
    
    timeExtension: {}
});

module.exports = mongoose.model("ResolutionContractor", ResolutionContractorSchema);



