import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { markAsRead } from '../../services/notificationsDB';
import axios from 'axios';
import { baseUrl } from '../../assets/common/baseUrl';
import * as SecureStore from 'expo-secure-store';

// Update the defaultSource to use require with correct path
const placeholderImage = require('../../assets/placeholder.png');

const NotificationDetails = ({ route, navigation }) => {
  const { notification } = route.params;
  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupNotification = async () => {
      if (notification?.id) {
        await markAsRead(notification.id);
      }

      const notificationData = notification?.data || {};
      
      if (notificationData.type === 'ORDER_STATUS_UPDATE') {
        // Ensure products array is valid
        const safeProducts = notificationData.products?.map(p => ({
          ...p,
          price: p.price || 0,
          name: p.name || 'Product Unavailable',
          quantity: p.quantity || 1
        })) || [];

        setOrder({
          _id: notificationData.orderId,
          orderNumber: notificationData.orderNumber,
          products: safeProducts,
          status: notificationData.status,
          paymentMethod: notificationData.paymentMethod,
          createdAt: notificationData.orderDate,
          customer: notificationData.customer
        });
      } else if (notificationData.type === 'PRODUCT_DISCOUNT') {
        setProduct({
          _id: notificationData.productId,
          name: notificationData.productName || 'Product',
          image: notificationData.image,
          price: notificationData.price || 0,
          discountedPrice: notificationData.discountedPrice || 0,
          discount: notificationData.discount || 0
        });
      }
      
      setLoading(false);
    };

    setupNotification();
  }, [notification]);

  const fetchOrderDetails = async (orderId) => {
    if (orderId) {
      try {
        setLoading(true);
        const token = await SecureStore.getItemAsync('jwt');
        
        const response = await axios.get(
          `${baseUrl}/admin/orders/${orderId}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data) {
          console.log('Found order:', response.data);
          setOrder(response.data);
        } else {
          console.log('Order not found:', orderId);
        }
      } catch (error) {
        console.error('Error fetching order:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const fetchProductDetails = async (productId) => {
    try {
      console.log('Fetching product details for:', productId);
      const token = await SecureStore.getItemAsync('jwt');
      
      // Try the alternate endpoint with error handling
      try {
        const response = await axios.get(
          `${baseUrl}/products/${productId}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );

        // Check response structure and handle data appropriately
        const productData = response.data?.product || response.data;
        
        // Return only essential fields
        return {
          _id: productId,
          name: productData.name || product.name,
          price: productData.price || product.price,
          discount: productData.discount || product.discount || 0,
          discountedPrice: productData.discountedPrice || (
            productData.price * (1 - (productData.discount || 0) / 100)
          ),
          images: productData.images?.length ? productData.images : [{ url: product.image }]
        };
      } catch (apiError) {
        // If first attempt fails, try backup endpoint
        console.log('First endpoint failed, trying backup...');
        const backupResponse = await axios.get(
          `${baseUrl}/product/${productId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );

        const backupData = backupResponse.data;
        return {
          _id: productId,
          name: backupData.name || product.name,
          price: backupData.price || product.price,
          discount: backupData.discount || product.discount || 0,
          discountedPrice: backupData.discountedPrice || product.discountedPrice,
          images: backupData.images?.length ? backupData.images : [{ url: product.image }]
        };
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Return minimal fallback data
      return {
        _id: productId,
        name: product.name,
        price: product.price,
        discount: product.discount || 0,
        discountedPrice: product.discountedPrice,
        images: [{ url: product.image }]
      };
    }
  };

  const handleViewProduct = async () => {
    if (!product?._id) {
      Alert.alert('Error', 'Product information is missing');
      return;
    }

    setLoading(true);

    try {
      const productDetails = await fetchProductDetails(product._id);
      console.log('Complete product details:', productDetails);

      if (productDetails) {
        navigation.navigate('ProductDetails', { product: productDetails });
      }
    } catch (error) {
      console.error('Error handling product view:', error);
      // Use the notification product data as fallback
      navigation.navigate('ProductDetails', {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          discount: product.discount || 0,
          discountedPrice: product.discountedPrice,
          images: [{ url: product.image }]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      // Handle different date formats
      const date = typeof dateString === 'number'
        ? new Date(dateString)
        : new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date not available';
    }
  };

  const formatCurrency = (amount) => {
    return `₱${Number(amount).toFixed(2)}`;
  };

  const calculateOrderTotals = (products) => {
    if (!products?.length) return { subtotal: 0, total: 0 };
    
    const total = products.reduce((sum, item) => {
      const product = item.productId || item;
      const price = product?.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    
    return {
      subtotal: total,
      total: total
    };
  };

  const renderOrderDetails = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
        </View>
      );
    }

    if (!order) return null;

    const { subtotal, total } = calculateOrderTotals(order.products);

    // Format order number safely
    const orderNumber = order._id 
      ? `Order #${order._id.toString().slice(-4)}`
      : order.orderNumber || 'Order Details';

    return (
      <View style={styles.orderContainer}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{orderNumber}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: order.status === 'completed' ? '#4CAF50' : 
              order.status === 'cancelled' ? '#F44336' : '#FF8C00' }
          ]}>
            <Text style={styles.statusText}>
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Payment:</Text>
          <Text style={styles.infoValue}>
            {(order.paymentMethod || 'cash_on_delivery')
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Ordered Items:</Text>
        <View style={styles.itemsList}>
          {order.products?.map((item, index) => (
            <OrderItem 
              key={index}
              item={item}
              formatCurrency={formatCurrency}
            />
          ))}
        </View>

        <OrderTotals
          subtotal={subtotal}
          total={total}
          formatCurrency={formatCurrency}
        />
      </View>
    );
  };

  // Add helper function for formatting payment method
  const formatPaymentMethod = (method) => {
    if (!method) return 'Cash on Delivery';
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Add renderProductDiscount function
  const renderProductDiscount = () => {
    if (!product) return null;

    return (
      <TouchableOpacity 
        style={styles.productDiscountContainer}
        onPress={handleViewProduct}  // Changed to use handleViewProduct
      >
        <Image
          source={{ uri: product.image }}
          style={styles.discountProductImage}
          defaultSource={placeholderImage}  // Use the imported placeholder
        />
        <View style={styles.discountInfo}>
          <Text style={styles.discountProductName}>{product.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>₱{product.price.toFixed(2)}</Text>
            <Text style={styles.discountedPrice}>₱{product.discountedPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}% OFF</Text>
          </View>
        </View>

        {/* <View style={styles.callToAction}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="arrow-forward" size={20} color="#FF8C00" />
        </View> */}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.notificationHeader}>
          <Ionicons 
            name={notification?.data?.type === 'PRODUCT_DISCOUNT' ? "pricetag" : "receipt"} 
            size={32} 
            color="#FF8C00" 
          />
          <Text style={styles.timestamp}>
            {formatDate(
              notification?.created_at || 
              notification?.notification?.date ||
              new Date().getTime()
            )}
          </Text>
        </View>

        <Text style={styles.title}>
          {notification?.title || notification?.notification?.request?.content?.title || 'Order Update'}
        </Text>
        <Text style={styles.body}>
          {notification?.body || notification?.notification?.request?.content?.body || ''}
        </Text>

        {notification?.data?.type === 'ORDER_STATUS_UPDATE' ? renderOrderDetails() : renderProductDiscount()}
      </ScrollView>
    </View>
  );
};

// Extract components for better organization
const OrderItem = ({ item, formatCurrency }) => {
  if (!item) return null;

  // Check if the product data is nested or direct
  const product = item.productId || item;
  const price = product?.price || 0;
  const quantity = item.quantity || 1;

  return (
    <View style={styles.productItem}>
      <Image 
        source={{ uri: product?.image }}
        style={styles.productImage}
        defaultSource={placeholderImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>
          {product?.name || 'Product Unavailable'}
        </Text>
        <Text style={styles.productQuantity}>
          {quantity}x @ {formatCurrency(price)}
        </Text>
        <Text style={styles.itemTotal}>
          {formatCurrency(price * quantity)}
        </Text>
      </View>
    </View>
  );
};

const OrderTotals = ({ subtotal, total, formatCurrency }) => (
  <View style={styles.totalSection}>
    <TotalRow label="Subtotal" value={formatCurrency(subtotal)} />
    <TotalRow 
      label="Total" 
      value={formatCurrency(total)}
      style={styles.finalTotal}
      valueStyle={styles.finalTotalValue}
    />
  </View>
);

const TotalRow = ({ label, value, style, valueStyle }) => (
  <View style={[styles.totalRow, style]}>
    <Text style={styles.totalLabel}>{label}</Text>
    <Text style={[styles.totalValue, valueStyle]}>{value}</Text>
  </View>
);

const additionalStyles = {
  productDiscountContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  discountProductImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  discountInfo: {
    marginBottom: 15,
  },
  discountProductName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#666',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  discountBadge: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  discountText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  callToAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  viewDetailsText: {
    color: '#FF8C00',
    fontWeight: 'bold',
    marginRight: 5,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timestamp: {
    color: '#666',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  body: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 20,
  },
  orderContainer: {
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfo: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  productImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF8C00',
    marginTop: 4,
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    color: '#666',
  },
  totalValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  finalTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  ...additionalStyles,
});

export default NotificationDetails;