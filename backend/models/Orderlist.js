const mongoose = require('mongoose');

// Define the Order List schema
const orderListSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1, // Default quantity is 1
        min: [1, "Quantity cannot be less than 1."]
    },
    timestamp: {
        type: Date,
        default: Date.now // Automatically set the timestamp
    }
});

// Add pre-find middleware for logging
orderListSchema.pre('find', function() {
    console.log('OrderList Model - Executing find with query:', this.getQuery());
});

orderListSchema.pre('findOne', function() {
    console.log('OrderList Model - Executing findOne with query:', this.getQuery());
});

// Add post-find middleware for logging
orderListSchema.post('find', function(docs) {
    console.log('OrderList Model - Found documents:', docs.length);
});

orderListSchema.post('findOne', function(doc) {
    console.log('OrderList Model - Found document:', doc ? 'Yes' : 'No');
});

// Create the Order List model
const OrderList = mongoose.model('OrderList', orderListSchema);

module.exports = OrderList;