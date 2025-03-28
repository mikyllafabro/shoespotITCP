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
    getUserAllReviews
} = require('../controllers/product');

//USER
//read
router.get('/products', getProducts);
router.get('/product/:id', getSingleProduct);
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
router.delete('/admin/product/delete/:id', deleteProduct);

router.delete('/product/:productId/review/:reviewId', deleteReview);

module.exports = router;
