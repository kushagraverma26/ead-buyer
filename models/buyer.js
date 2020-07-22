var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var buyer = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: {
        type: Number, required: true
    },
    wallet: {
        type: Number, default: 100
    },
    outstandingBill: {
        type: Number, default: 0
    },
    location: {
        lat: {
            type: Number, required: true
        },
        long: {
            type: Number, required: true
        }
    },
    address: {
        line1: { type: String, required: true },
        line2: String,
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: Number, required: true }

    },
    createdDate: { type: Date, default: Date.now }

})

module.exports = mongoose.model('Buyers',buyer)