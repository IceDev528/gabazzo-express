const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    price: String,
    title: String,
    category: String,
    service: String,
    description: String,
    images: [
        { url: String, public_id: String }
    ],
    owner: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    time: String,
    tags: String,
    specificationTitle: String,
    specificationDescription: String,
    specificationTitle2: String,
    specificationDescription2: String,
    deliveryInfo: String,
    deliveryCharge: String,
    returnTime: String
});

module.exports = mongoose.model('Product', ProductSchema);
