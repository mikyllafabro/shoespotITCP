const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    amount: { type: Number, required: true }
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;