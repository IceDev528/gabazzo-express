const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
    conversationID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    isSeen: Boolean,
    messages: {
      attachments: { type: Array, default: [] },
      text: String,
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
    },
    offerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
