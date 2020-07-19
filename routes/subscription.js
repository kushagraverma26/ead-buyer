var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subscription = new Schema({
    // subscription name
    name: { type: String, default: "New Subscription " + Date.now.toString},
    // category: { type: String, required: true, enum: ["meats", "dairy", "vegetables", "fruits"] },
    // quantity: { type: Number, required: true},
    createdBy: {
        type: Schema.Types.ObjectId, ref: 'Buyers', required: true
    },
    type: {type: String, required: true, enum: ["daily", "weekly", "monthly"]},
    order: {type: Object, required: true},
    lastDelivered: {type:Date},
    createdDate: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Postings',posting)