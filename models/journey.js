const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JourneySchema = new Schema({
    year: String,
    Description: String,
    title: String,
    owner: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
});


module.exports = mongoose.model('Journey', JourneySchema);
