const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CertificateSchema = new Schema({
    title: String,
    date: String,
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


module.exports = mongoose.model('Certificate', CertificateSchema);