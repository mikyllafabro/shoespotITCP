const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { updateOrderStatus } = require('../controllers/fetchOrders');
const sendOrderConfirmationEmail = require('../controllers/sendEmail');


const { placeOrder,
    getUserOrders,
    // deleteOrderedProducts } = require('../controllers/order');
    deleteOrderedProducts
    // updateOrderStatus,

} = require('../controllers/order');

router.post('/place-order', protect, placeOrder);
router.get('/user-orders/:userId', protect, getUserOrders);
router.delete('/delete-ordered-products', protect, deleteOrderedProducts);

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