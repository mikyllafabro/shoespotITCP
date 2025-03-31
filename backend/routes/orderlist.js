const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const { addToOrderList,
    getUserId,
    getOrderListCount,
    getUserOrderList,
    deleteOrder,
    updateOrderQuantity
 } = require('../controllers/orderlist');

// Add logging middleware
const logRequest = (req, res, next) => {
    console.log('OrderList Route - Incoming request:', {
        path: req.path,
        method: req.method,
        userId: req.user?._id,
        params: req.params,
        query: req.query,
        body: req.body
    });
    next();
};

router.use(logRequest);

// Route to add an item to the order list
router.post('/add-to-orderlist', protect, addToOrderList);
router.get('/get-user-id', getUserId);
router.get('/get-orderlist-count', protect, getOrderListCount);
router.get('/user-orderlist', protect, async (req, res, next) => {
    console.log('OrderList Route - Fetching user order list for:', req.user?._id);
    next();
}, getUserOrderList);
router.delete('/delete-order/:orderId', protect, async (req, res, next) => {
    console.log('Delete request received for order:', req.params.orderId);
    next();
}, deleteOrder);
router.put('/update-order/:orderId', protect, updateOrderQuantity);

module.exports = router;