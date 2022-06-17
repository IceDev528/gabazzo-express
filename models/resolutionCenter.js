const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ResolutionSchema = new Schema({
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
    
    timeExtension: {}
});

module.exports = mongoose.model("Resolution", ResolutionSchema);



