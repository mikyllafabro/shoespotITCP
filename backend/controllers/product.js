const Product = require('../models/Product')
const cloudinary = require('cloudinary')
const APIFeatures = require('../utils/apiFeatures.js')
const { admin, db } = require('../utils/firebaseConfig');
const User = require('../models/UserModel');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let Filter;

(async () => {
  const { Filter: BadWordsFilter } = await import('bad-words');
  Filter = new BadWordsFilter();
})();

//CREATE
exports.createProduct = async (req, res, next) => {
    try {
        // Parse numeric values with validation
        const productData = {
            ...req.body,
            price: parseFloat(req.body.price) || 0,
            discount: Math.min(Math.max(parseFloat(req.body.discount) || 0, 0), 100), // Ensure 0-100 range
            stock: parseInt(req.body.stock) || 0
        };

        // Calculate discounted price
        productData.discountedPrice = +(productData.price * (1 - productData.discount/100)).toFixed(2);

        console.log('Creating product with data:', {
            price: productData.price,
            discount: productData.discount,
            calculatedDiscountedPrice: productData.discountedPrice
        });

        // Process images
        if (req.files && req.files.length > 0) {
            productData.images = await Promise.all(req.files.map(async file => {
                const result = await cloudinary.v2.uploader.upload(file.path);
                return {
                    public_id: result.public_id,
                    url: result.secure_url
                };
            }));
        }

        const product = await Product.create(productData);

        return res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Product creation error:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//READ ALL PRODUCTS

exports.getProducts = async (req, res, next) => {
    try {
        console.log('Fetching products with query:', req.query);

        const query = {};
        
        // Add filters if they exist
        if (req.query.keyword) {
            query.name = { $regex: req.query.keyword, $options: 'i' };
        }
        if (req.query.brand) {
            query.brand = req.query.brand;
        }
        if (req.query['price.min'] || req.query['price.max']) {
          query.price = {};
          if (req.query['price.min']) {
              query.price.$gte = parseFloat(req.query['price.min']);
          }
          if (req.query['price.max']) {
              query.price.$lte = parseFloat(req.query['price.max']);
          }
      }

        console.log('Final MongoDB query:', query);

        const products = await Product.find(query);
        
        console.log(`Found ${products.length} products`);

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

//FETCH BRANDS
const fetchBrands = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/brands`);
        // Assuming the response contains an array of brands
        setBrands(response.data.brands);  // Set brands from response
    } catch (error) {
        console.error('Error fetching brands:', error);
    }
};

//READ SPECIFIC PRODUCT
exports.getSingleProduct = async (req, res, next) => {
    try {
        console.log('Fetching product with ID:', req.params.id);
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const product = await Product.findById(req.params.id);
        
        console.log('Found product:', product);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
};


// UPDATE PRODUCT
exports.updateProduct = async (req, res, next) => {
    try {
        const updates = { ...req.body };
        
        // Handle numeric fields
        if (updates.price !== undefined) updates.price = Number(updates.price);
        if (updates.discount !== undefined) updates.discount = Number(updates.discount);
        if (updates.stock !== undefined) updates.stock = Number(updates.stock);

        let product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Calculate new discounted price
        if (updates.price !== undefined || updates.discount !== undefined) {
            const newPrice = updates.price ?? product.price;
            const newDiscount = updates.discount ?? product.discount;
            updates.discountedPrice = +(newPrice * (1 - newDiscount/100)).toFixed(2);
        }

        // Handle images if present
        if (req.files && req.files.length > 0) {
            // Delete old images from cloudinary
            for (let i = 0; i < product.images.length; i++) {
                await cloudinary.v2.uploader.destroy(product.images[i].public_id);
            }

            // Upload new images
            let imagesLinks = [];
            for (let i = 0; i < req.files.length; i++) {
                const result = await cloudinary.v2.uploader.upload(req.files[i].path, {
                    folder: 'products',
                });
                imagesLinks.push({
                    public_id: result.public_id,
                    url: result.secure_url
                });
            }
            updates.images = imagesLinks;
        }

        product = await Product.findByIdAndUpdate(
            req.params.id, 
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res, next) => {
    try {
        console.log('Attempting to delete product:', req.params.id);
        
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            console.log('Product not found');
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete images from cloudinary if they exist
        if (product.images && product.images.length > 0) {
            try {
                for (const image of product.images) {
                    if (image.public_id) {
                        console.log('Deleting image:', image.public_id);
                        await cloudinary.v2.uploader.destroy(image.public_id);
                    }
                }
            } catch (cloudinaryError) {
                console.error('Cloudinary deletion error:', cloudinaryError);
                // Continue with product deletion even if image deletion fails
            }
        }

        // Delete the product from database
        await Product.findByIdAndDelete(req.params.id);
        console.log('Product deleted successfully');

        return res.status(200).json({
            success: true,
            message: `Product deleted successfully`
        });
    } catch (error) {
        console.error('Delete product error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

// Create or Update product review
exports.createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        // Use id instead of productId to match the route pattern
        const productId = req.params.id; 
        
        console.log(`Creating review for product: ${productId}`);
        console.log(`Review data:`, req.body);

        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both rating and comment'
            });
        }

        // Validate the product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Create review with user data from req.user (set by auth middleware)
        const review = {
            user: req.user.id,
            name: req.user.name,
            userImage: req.user.photo || '',
            rating: Number(rating),
            comment,
            createdAt: new Date()
        };

        console.log('Creating review with user data:', review);

        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;

        // Calculate average rating
        product.ratings = product.reviews.reduce((acc, item) => acc + item.rating, 0) 
            / product.reviews.length;

        await product.save();

        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            review
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating review'
        });
    }
};
  
    
exports.getUserProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get user ID from auth middleware
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    console.log('Fetching review for Product ID:', productId, 'User ID:', userId);

    // Validate the productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('Invalid Product ID format:', productId);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Product ID format.' 
      });
    }

    // Fetch the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found.' 
      });
    }

    // Fetch the user's review
    const userReview = product.reviews.find(
      (review) => review.user.toString() === userId.toString()
    );

    if (!userReview) {
      return res.status(404).json({ 
        success: false, 
        message: 'No review found for this product by the user.' 
      });
    }

    return res.status(200).json({
      success: true,
      review: userReview,
    });
  } catch (error) {
    console.error('Error fetching user review:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user review.',
      error: error.message
    });
  }
};
    
exports.getUserAllReviews = async (req, res) => {
  try {
    // Get the user ID from the authenticated request
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    console.log('Fetching all reviews for user:', userId);

    // Find all products that contain a review by the user
    const productsWithReviews = await Product.find({
      'reviews.user': userId,
    });

    console.log(`Found ${productsWithReviews.length} products with reviews by user`);

    // Extract only the reviews made by the user
    const userReviews = productsWithReviews.map((product) => {
      const review = product.reviews.find(
        (review) => review.user.toString() === userId.toString()
      );
      return {
        productId: product._id,
        productName: product.name,
        productImage: product.images && product.images.length > 0 ? product.images[0].url : null,
        review,
      };
    });

    return res.status(200).json({
      success: true,
      reviews: userReviews,
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user reviews',
      error: error.message
    });
  }
};
      
//get reviews
exports.getProductReviews = async (req, res) => {
  try {
      const { productId } = req.params;

      console.log('Fetching reviews for product:', productId);

      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({
              success: false,
              message: 'Product not found'
          });
      }

      // Ensure we have reviews array and it's sorted
      const reviews = product.reviews || [];
      const sortedReviews = reviews.sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      console.log('Found reviews:', sortedReviews);

      return res.status(200).json({
          success: true,
          reviews: sortedReviews
      });
  } catch (error) {
      console.error('Error fetching product reviews:', error);
      return res.status(500).json({
          success: false,
          message: 'Failed to fetch product reviews'
      });
  }
};
  
//delete review
exports.deleteReview = async (req, res) => {
  try {
      const { productId, reviewId } = req.params;

      // Find the product by its ID
      const product = await Product.findById(productId);

      if (!product) {
          return res.status(404).json({
              success: false,
              message: 'Product not found',
          });
      }

      // Find the review to delete
      const reviewIndex = product.reviews.findIndex(
          (review) => review._id.toString() === reviewId
      );

      if (reviewIndex === -1) {
          return res.status(404).json({
              success: false,
              message: 'Review not found',
          });
      }

      // Remove the review
      product.reviews.splice(reviewIndex, 1);

      // Recalculate ratings and numOfReviews
      const numOfReviews = product.reviews.length;
      const ratings =
          numOfReviews > 0
              ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / numOfReviews
              : 0;

      // Update the product document
      product.numOfReviews = numOfReviews;
      product.ratings = ratings;

      await product.save();

      return res.status(200).json({
          success: true,
          message: 'Review deleted successfully',
          product,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          success: false,
          message: 'Server error',
      });
  }
};

// Correctly implemented updateProductReview function
exports.updateProductReview = async (req, res) => {
    try {
        const { id: productId, reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        console.log(`Updating review ${reviewId} for product ${productId} by user ${userId}`);
        console.log('New review data:', { rating, comment });

        // Find the product
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find the review in the product's reviews array
        const reviewIndex = product.reviews.findIndex(
            (review) => review._id.toString() === reviewId && review.user.toString() === userId
        );

        if (reviewIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or not authorized to update'
            });
        }

        // Update review
        product.reviews[reviewIndex].rating = Number(rating);
        product.reviews[reviewIndex].comment = comment;
        product.reviews[reviewIndex].updatedAt = new Date();

        // Recalculate product rating
        product.numOfReviews = product.reviews.length;
        
        if (product.reviews.length > 0) {
            product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
        } else {
            product.ratings = 0;
        }

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            review: product.reviews[reviewIndex]
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getInventoryStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const lowStockProducts = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });
        const outOfStockProducts = await Product.countDocuments({ stock: 0 });

        return res.status(200).json({
            success: true,
            stats: {
                totalProducts,
                lowStockProducts,
                outOfStockProducts
            }
        });
    } catch (error) {
        console.error('Error fetching inventory stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching inventory stats'
        });
    }
};