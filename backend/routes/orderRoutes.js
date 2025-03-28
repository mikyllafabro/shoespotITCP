// routes/orderRoutes.js
const express = require('express');
const { getOrdersData, getAllOrders, getAllStatuses, updateOrderStatus } = require('../controllers/fetchOrders');  // Import your controller
const router = express.Router();

const protect = require('../middleware/protect');
const adminProtect = require('../middleware/adminprotect');
const userProtect = require('../middleware/userProtect');


// Define routes for fetching order data

router.get('/orders/status', getOrdersData);  // Route for fetching aggregated order data by status
router.get('/orders', getAllOrders);  // Route for fetching all orders with product and user details
router.get('/orders/statuses', getAllStatuses);  // Route for fetching all distinct statuses of the products
router.put('/orders/statuses/:orderId', updateOrderStatus);



module.exports = router;
