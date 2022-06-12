const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MediaPhotoSchema = new Schema({
    title: String,
    description: String,
    imageUrl: String,
    imageId: String,
    owner: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }

});


module.exports = mongoose.model('MediaPhoto', MediaPhotoSchema);