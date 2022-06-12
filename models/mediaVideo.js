const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MediaVideoSchema = new Schema({
    title: String,
    description: String,
    videoUrl: String,
    videoId: String,
    owner: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }

});


module.exports = mongoose.model('MediaVideo', MediaVideoSchema);