const Order = require('../models/Order');
const User = require('../models/UserModel');
const { admin, db } = require('../utils/firebaseConfig');

const getOrdersData = async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'email')
      .populate('products.productId', 'name price discount discountedPrice')  // Add discount fields
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      email: order.userId ? order.userId.email : 'N/A',
      status: order.status || 'pending',
      paymentMethod: order.paymentMethod,
      products: order.products.map(prod => {
        const product = prod.productId;
        const finalPrice = product ? 
          (product.discountedPrice || product.price) : 0;  // Use discounted price if available
        
        return {
          name: product ? product.name : 'Product Unavailable',
          quantity: prod.quantity,
          price: finalPrice,
          hasDiscount: product ? !!product.discount : false,
          originalPrice: product ? product.price : 0
        };
      }),
      total: order.total,
      createdAt: order.createdAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllStatuses = async (req, res) => {
    try {
      const statuses = await Order.aggregate([
        {
          $unwind: "$products"
        },
        {
          $lookup: {
            from: 'products',
            localField: 'products.productId',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        {
          $unwind: "$productDetails"
        },
        {
          $group: {
            _id: "$_id",
            status: { $first: "$status" },
            products: { $push: "$productDetails.name" } 
          }
        },
        {
          $project: {
            orderId: "$_id",
            status: 1,
            products: 1,
            _id: 0
          }
        }
      ]);
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const userId = req.user?._id;

    console.log('Updating order status:', {
      orderId,
      status,
      userId,
      params: req.params,
      body: req.body
    });

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    console.log('Order updated successfully:', {
      id: order._id,
      newStatus: order.status
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('products.productId', 'name price images discount discountedPrice')
      .sort('-createdAt');
    
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderItems: order.products.map(prod => ({
        name: prod.productId?.name || 'Product Unavailable',
        quantity: prod.quantity,
        price: prod.productId?.discountedPrice || prod.productId?.price || 0,
        image: prod.productId?.images?.[0]?.url || null
      })),
      totalPrice: order.products.reduce((total, prod) => {
        return total + ((prod.productId?.discountedPrice || prod.productId?.price || 0) * prod.quantity);
      }, 0),
      orderStatus: order.status,
      createdAt: order.createdAt
    }));

    res.json({ success: true, orders: formattedOrders });
  } catch (error) {
    console.error("Error in getUserOrders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

module.exports = { 
  getOrdersData, 
  getAllOrders, 
  getAllStatuses, 
  updateOrderStatus, 
  getUserOrders 
};