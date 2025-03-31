const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const sendOrderConfirmationEmail = require('../controllers/sendEmail');

const { placeOrder, deleteOrderedProducts } = require('../controllers/order');
const { getOrdersData, getAllOrders, getAllStatuses, updateOrderStatus, getUserOrders } = require('../controllers/fetchOrders');

router.post('/place-order', protect, placeOrder);
router.get('/user-orders/:userId', protect, getUserOrders);
router.delete('/delete-ordered-products', protect, deleteOrderedProducts);

// Move this route before the dynamic routes to prevent conflicts
router.get('/me', protect, getUserOrders);

// Fix the status update route
router.patch('/order/:orderId/status', protect, (req, res) => {
  console.log('Status update route hit:', {
    orderId: req.params.orderId,
    status: req.body.status,
    user: req.user?._id,
    params: req.params
  });
  updateOrderStatus(req, res);
});

// Add a route to get all orders
router.get('/orders', protect, async (req, res) => {
  try {
    console.log('Getting all orders, user:', req.user._id);
    const orders = await Order.find()
      .populate('userId', 'email')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Failed to get orders' });
  }
});

// Remove or comment out the duplicate route
// router.get('/orders/me', protect, getUserOrders);

router.post('/send-order-confirmation', protect, async (req, res) => {
    const { email, orderDetails } = req.body;
// Basic validation for the incoming request data
if (!email || !orderDetails || !orderDetails.products || orderDetails.products.length === 0) {
    return res.status(400).send({ error: 'Invalid data: Email and order details are required.' });
  }

  try {
    await sendOrderConfirmationEmail(email, orderDetails);
    console.log('Email sent successfully');
    res.status(200).send('Email sent successfully');
  } catch (error) {
    // Error handling for email sending failure
    console.error('Error in /send-order-confirmation route:', error);

    if (process.env.NODE_ENV === 'development') {
      // In development, log full error stack for debugging
      return res.status(500).send({ error: error.stack || error.message });
    } else {
      // In production, send a generic error message
      return res.status(500).send({ error: 'Failed to send order confirmation email.' });
    }
  }
});

module.exports = router;