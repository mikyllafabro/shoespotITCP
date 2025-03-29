const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const protect = require('../middleware/auth');

const {
    createProduct,
    getProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
    getProductReviews,
    deleteReview,
    getUserProductReview,
    getUserAllReviews,
    getInventoryStats
} = require('../controllers/product');

//USER
//read
router.get('/products/:id', getSingleProduct); // Changed from /product/:id to /products/:id
router.get('/products', getProducts);  // This should match the frontend route
router.get('/product/:productId/reviews', getProductReviews);

router.get('/product/:productId/my-review', getUserProductReview);
router.get('/product/user-reviews', getUserAllReviews);
router.post('/product/:id/review', createProductReview);

//ADMIN
//create
router.post('/admin/product/create', upload.array('images', 10), createProduct);
//update
router.put('/admin/product/update/:id', updateProduct);
//delete
router.delete('/admin/product/delete/:id', async (req, res, next) => {
    try {
        await deleteProduct(req, res, next);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting product'
        });
    }
});

router.delete('/product/:productId/review/:reviewId', deleteReview);

router.get('/inventory-stats', getInventoryStats);

module.exports = router;
