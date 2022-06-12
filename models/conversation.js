const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConversationSchema = new Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMsgTime: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
