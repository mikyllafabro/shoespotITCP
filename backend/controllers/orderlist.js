const OrderList = require('../models/Orderlist');
const User = require('../models/UserModel');
const Product = require('../models/Product'); 
const { admin, db } = require('../utils/firebaseConfig');

exports.addToOrderList = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const user_id = req.user._id; // Get user ID from authenticated request

    if (!product_id || !quantity) {
      return res.status(400).json({ message: 'Product ID and Quantity are required.' });
    }

    // Verify product existence
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check if the product already exists in the user's order list
    const existingOrder = await OrderList.findOne({ product_id, user_id });

    if (existingOrder) {
      existingOrder.quantity += quantity;
      await existingOrder.save();
      return res.status(200).json({
        message: 'Order list updated successfully.',
        order: existingOrder
      });
    }

    // Create new order
    const newOrder = new OrderList({
      product_id,
      user_id,
      quantity
    });

    await newOrder.save();

    res.status(201).json({
      message: 'Product added to order list successfully.',
      order: newOrder
    });
  } catch (error) {
    console.error('Error adding to order list:', error);
    res.status(500).json({ message: 'Failed to add product to order list.' });
  }
};

exports.getUserId = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log("Extracted Token:", token);

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("Decoded Token:", decodedToken);

    const email = decodedToken.email;
    if (!email) {
      return res.status(400).json({ message: 'Email not found in token.' });
    }

    console.log("Extracted Email:", email);

    // Find the user in MongoDB by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Respond with the user's ID
    res.status(200).json({ user_id: user._id });
  } catch (error) {
    console.error('Error fetching user ID:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Example route handler
exports.getOrderListCount = async (req, res) => {
  try {
    // Get user from protect middleware
    const user = req.user;
    
    // Count orders for the authenticated user
    const count = await OrderList.countDocuments({ user_id: user._id });
    
    console.log('Order count for user:', {
      userId: user._id,
      count: count
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching order list count:', error);
    res.status(500).json({ message: 'Failed to fetch order list count.' });
  }
};

// Update getUserOrderList to use JWT authentication as well
exports.getUserOrderList = async (req, res) => {
  try {
    // Ensure user exists in request
    if (!req.user || !req.user._id) {
      console.error('No authenticated user found');
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    console.log('Fetching order list for user:', {
      id: req.user._id,
      email: req.user.email
    });

    // Fetch all order list items for this user
    const orders = await OrderList.find({ user_id: req.user._id })
      .populate({
        path: 'product_id',
        select: '_id name description price images'
      });

    console.log('Found orders:', orders.length);

    if (!orders || orders.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No items in the order list.',
        orders: [] 
      });
    }

    // Map the orders with product details
    const formattedOrders = orders.map((order) => {
      if (!order.product_id) {
        console.warn('Order without product:', order._id);
        return null;
      }

      return {
        order_id: order._id,
        product: {
          id: order.product_id._id,
          name: order.product_id.name,
          description: order.product_id.description,
          price: order.product_id.price,
          image: order.product_id.images[0]?.url || '',
        },
        quantity: order.quantity,
        timestamp: order.timestamp,
      };
    }).filter(Boolean); // Remove null entries

    console.log('Formatted orders count:', formattedOrders.length);

    res.status(200).json({
      success: true,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Error in getUserOrderList:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user order list.',
      error: error.message
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = req.user; // From protect middleware

    console.log('Attempting to delete order:', {
      orderId,
      userId: user._id
    });

    // Find and delete the order
    const deletedOrder = await OrderList.findOneAndDelete({
      _id: orderId,
      user_id: user._id // Ensure user owns this order
    });

    if (!deletedOrder) {
      console.log('Order not found or unauthorized');
      return res.status(404).json({ 
        message: 'Order not found or unauthorized to delete' 
      });
    }

    console.log('Order deleted successfully:', deletedOrder);
    res.status(200).json({ 
      message: 'Order deleted successfully',
      orderId: orderId
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ 
      message: 'Failed to delete order',
      error: error.message 
    });
  }
};

exports.updateOrderQuantity = async (req, res) => {
  try {
    const { orderId } = req.params; // Extract orderId from the route params
    const { quantity } = req.body; // Extract the new quantity from the request body

    // Check if quantity is valid
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0.' });
    }

    // Find the order and update its quantity
    const updatedOrder = await OrderList.findByIdAndUpdate(
      orderId,
      { quantity },
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json({
      message: 'Order quantity updated successfully.',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order quantity:', error);
    res.status(500).json({ message: 'Failed to update order quantity.' });
  }
};

exports.deleteOrderedProducts = async (req, res) => {
  try {
    const { orderIds } = req.body;
    const user = req.user; // From protect middleware

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid request. Please provide an array of order IDs.'
      });
    }

    console.log('Deleting orders:', {
      orderIds,
      userId: user._id
    });

    const result = await OrderList.deleteMany({
      _id: { $in: orderIds },
      user_id: user._id
    });

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        message: 'No matching orders found to delete.'
      });
    }

    res.status(200).json({
      message: 'Orders removed successfully',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting orders:', error);
    res.status(500).json({
      message: 'Failed to delete orders',
      error: error.message
    });
  }
};