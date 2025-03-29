const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter product name."],
        trim: true,
        maxLength: [100, "Product name cannot exceed up to 100 characters."]
    },
    description: {
        type: String,
        required: [true, "Please enter product description."]
    },
    price: {
        type: Number,
        required: [true, "Please enter product price."]
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        set: function(val) {
            // Ensure discount is a valid number between 0-100
            const discount = Number(val) || 0;
            return Math.min(Math.max(discount, 0), 100);
        }
    },
    discountedPrice: {
        type: Number,
        default: function() {
            return this.price;
        }
    },
    ratings: {
        type: Number,
        default: 0
    },
    images: [
        {
            public_id: {
                type: String,
                required: false
            },
            url: {
                type: String,
                required: false
            }
        }
    ],
    brand: {
        type: String,
        required: [true, "Please enter product category."],
        enum: {
            values: [
                'Adidas',
                'Nike',
                'Converse',
            ],
            message: 'Please select correct category for product'
        }
    },
    status: {
        type: String,
        required: [true, "Please enter product status."],
        enum: {
            values: [
                'Available',
                'Unavailable'
            ],
            message: "Please select correct status."
        }
    },
    category: {
        type: String,
        required: [true, 'Please enter product category'],
        enum: {
            values: ['Running', 'Basketball', 'Casual', 'Training', 'Lifestyle'],
            message: 'Please select a valid category'
        }
    },
    stock: {
        type: Number,
        required: [true, 'Please enter product stock'],
        min: [0, 'Stock cannot be negative'],
        validate: {
            validator: Number.isInteger,
            message: 'Stock must be a whole number'
        }
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: true
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Update pre-save middleware to handle discount calculations
productSchema.pre('save', function(next) {
    // Ensure numeric values
    this.price = Number(this.price || 0);
    this.discount = Number(this.discount || 0);
    this.stock = Number(this.stock || 0);

    // Calculate discounted price whenever price or discount changes
    if (this.isModified('price') || this.isModified('discount')) {
        this.discountedPrice = +(this.price * (1 - this.discount/100)).toFixed(2);
        console.log('Calculated values:', {
            originalPrice: this.price,
            discount: this.discount,
            discountedPrice: this.discountedPrice
        });
    }

    next();
});

// Add pre-update middleware
productSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.price || update.discount) {
        const price = update.price || this._update.$set.price;
        const discount = update.discount || this._update.$set.discount || 0;
        update.discountedPrice = +(price * (1 - discount/100)).toFixed(2);
    }
    next();
});

// Add pre-findOneAndUpdate middleware
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  const price = update.price || this._update.$set?.price;
  const discount = update.discount || this._update.$set?.discount;

  if (price || discount) {
    const currentPrice = price || this._update.$set?.price;
    const currentDiscount = discount || this._update.$set?.discount || 0;
    
    if (currentPrice && currentDiscount >= 0) {
      this._update.$set = this._update.$set || {};
      this._update.$set.discountedPrice = 
        +(currentPrice * (1 - currentDiscount/100)).toFixed(2);
    }
  }
  next();
});

// Add a custom toJSON transform
productSchema.set('toJSON', {
    transform: function(doc, ret) {
        // Ensure stock is a number
        ret.stock = parseInt(ret.stock || 0);
        
        // Ensure category is included
        if (!ret.category) {
            ret.category = doc.category;
        }
        
        return ret;
    }
});

module.exports = mongoose.model('Product', productSchema);
