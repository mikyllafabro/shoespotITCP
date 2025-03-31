const Order = require('../models/Order');
const User = require('../models/UserModel');
const OrderList = require('../models/Orderlist');

// Place a new order
exports.placeOrder = async (req, res) => {
  try {
    const { userId, products, paymentMethod } = req.body;

    console.log('Received order request:', {
      userId,
      productsCount: products?.length,
      paymentMethod
    });

    if (!userId || !products || !Array.isArray(products) || products.length === 0) {
      console.error('Invalid order data:', { userId, products });
      return res.status(400).json({
        message: 'Invalid order data. Please provide userId and products array.'
      });
    }

    // Find user directly by MongoDB _id
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    const order = new Order({
      userId: user._id,
      products,
      paymentMethod,
      status: 'shipping',
    });

    await order.save();
    console.log('Order saved:', order);

    // Remove ordered items from cart
    try {
      const productIds = products.map(p => p.productId);
      await OrderList.deleteMany({
        user_id: userId,
        product_id: { $in: productIds }
      });
    } catch (deleteError) {
      console.error('Error removing items from cart:', deleteError);
      // Don't throw error, just log it since order was successful
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      message: 'Failed to place order',
      error: error.message,
    });
  }
};

// Get user order history
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).populate('products.productId', 'name price image');

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user.' });
    }

    res.status(200).json({ message: 'User order history retrieved successfully.', orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch user orders.', error: error.message });
  }
};

exports.deleteOrderedProducts = async (req, res) => {
  try {
    const { orderIds } = req.body;
    const user = req.user;

    console.log('Processing delete request:', {
      orderIds,
      userId: user._id
    });

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        message: 'Invalid request. Please provide an array of order IDs.'
      });
    }

    // Delete orders that belong to the user
    const result = await OrderList.deleteMany({
      _id: { $in: orderIds },
      user_id: user._id
    });

    console.log('Delete operation result:', {
      attempted: orderIds.length,
      deleted: result.deletedCount
    });

    // Only send success if we actually deleted something
    if (result.deletedCount > 0) {
      return res.status(200).json({
        message: `Successfully removed ${result.deletedCount} items from cart`,
        deletedCount: result.deletedCount
      });
    }

    // If nothing was deleted, send a 404
    return res.status(404).json({
      message: 'No matching orders found to delete',
      attempted: orderIds
    });

  } catch (error) {
    console.error('Error deleting ordered products:', error);
    res.status(500).json({ 
      message: 'Failed to remove items from cart',
      error: error.message 
    });
  }
};