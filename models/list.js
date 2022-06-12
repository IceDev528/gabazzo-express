const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ListSchema = new Schema({
    title: String,
    companies: [
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


module.exports = mongoose.model('List', ListSchema);