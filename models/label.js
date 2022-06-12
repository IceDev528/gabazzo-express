const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LabelSchema = new Schema({
    title: String,
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    owner: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }

});


module.exports = mongoose.model('Label', LabelSchema);