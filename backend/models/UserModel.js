const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a username'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    password: {
        type: String,
        required: function() {
            // Only require password for non-Google accounts
            return !this.googleId && !this.firebaseUid;
        },
        minlength: 6,
        select: false,
    },
    firebaseUid: {
        type: String,
        // Not required for all users
        unique: true,
        sparse: true, // This allows null/undefined values (only enforces uniqueness on actual values)
    },
    googleId: {
        type: String,
        // Not required but unique if provided
        unique: true,
        sparse: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    fcmToken: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    userImage: {
        type: String,
    },
    cloudinary_id: {
        type: String,
    },
    mobileNumber: {
        type: String,
        trim: true,
        default: null
    },
    address: {
        type: String,
        trim: true,
        default: null
    },
    orderlist: [
        {
          product_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Product'
          },
          quantity: {
              type: Number,
              default: 1
          }
        }
    ],
    lastLogin: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;