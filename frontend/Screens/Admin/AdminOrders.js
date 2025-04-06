import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  StatusBar, ActivityIndicator, Alert, Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import baseUrl from '../../assets/common/baseUrl';  // Fixed import path
import * as SecureStore from 'expo-secure-store';
import { sendOrderStatusNotification } from '../../utils/notifications';  // Add this import

const AdminOrders = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  // Move getStatusColor inside component
  const getStatusColor = (status) => {
    switch (status) {
      case 'shipping': return '#f39c12';  // orange
      case 'completed': return '#2ecc71'; // green
      case 'cancelled': return '#e74c3c'; // red
      default: return '#95a5a6';         // gray
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('jwt');
      if (!token) {
        console.error('No token found');
        return;
      }

      console.log('🔍 Starting to fetch orders...');
      console.log(`📡 API URL: ${baseUrl}/orders`);
      
      const response = await axios.get(`${baseUrl}/orders`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📦 Raw Response:', response.data);
      
      if (Array.isArray(response.data)) {
        console.log('📋 Number of orders:', response.data.length);
        setOrders(response.data);
      } else {
        console.error('❌ Invalid data format:', response.data);
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error.response?.data || error);
      Alert.alert('Error', 'Failed to fetch orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmStatusUpdate = (order, newStatus) => {
    setSelectedOrder(order);
    setPendingStatus(newStatus);
    setModalVisible(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder?._id || !pendingStatus) return;
    
    try {
      const token = await SecureStore.getItemAsync('jwt');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (!token) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      console.log('Attempting to update order:', {
        orderId: selectedOrder._id,
        newStatus: pendingStatus
      });

      // Update endpoint to match backend
      const response = await axios.patch(
        `${baseUrl}/order/${selectedOrder._id}/status`,  // Changed endpoint format -CHECKED
        { 
          status: pendingStatus
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Status update response:', response.data);

      if (response.data) {
        try {
          const orderData = {
            id: selectedOrder._id,
            orderNumber: selectedOrder._id.slice(-6),
            products: selectedOrder.products,
            customer: selectedOrder.email,
            userId: selectedOrder.userId || selectedOrder.user,
            date: selectedOrder.createdAt,
            paymentMethod: selectedOrder.paymentMethod,
            status: pendingStatus
          };

          await sendOrderStatusNotification(orderData, pendingStatus);
          console.log('Notification sent successfully');
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }

        // Refresh orders and show success
        await fetchOrders();
        Alert.alert(
          'Success', 
          `Order status updated to ${pendingStatus}`,
          [{ text: 'OK' }]
        );
        setModalVisible(false);
        setSelectedOrder(null);
        setPendingStatus(null);
      }
    } catch (error) {
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });

      Alert.alert(
        'Error',
        'Failed to update order status. Please check your connection and try again.'
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a56a4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a56a4" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('AdminHome')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Orders</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {orders.length === 0 ? (
          <Text style={styles.noOrders}>No orders found</Text>
        ) : (
          orders.map((order) => (
            <View key={order?._id || Math.random().toString()} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>
                  Order #{order?._id ? order._id.slice(-6) : 'N/A'}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order?.status) }]}>
                  <Text style={styles.statusText}>{order?.status || 'unknown'}</Text>
                </View>
              </View>

              <View style={styles.orderInfo}>
                <Text style={styles.label}>Customer: {order?.email || 'N/A'}</Text>
                <Text style={styles.label}>Payment: {order?.paymentMethod || 'N/A'}</Text>
                <View style={styles.productsContainer}>
                  <Text style={styles.productTitle}>Products:</Text>
                  {order?.products?.map((product, index) => (
                    <View key={index} style={styles.productItem}>
                      <Text style={styles.productName}>• {product.name}</Text>
                      <Text style={styles.productQuantity}>x{product.quantity}</Text>
                      <View style={styles.priceContainer}>
                        {product.hasDiscount && (
                          <Text style={styles.originalPrice}>₱{product.originalPrice}</Text>
                        )}
                        <Text style={styles.productPrice}>₱{product.price}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                    <Text style={styles.totalAmount}>
                      ₱{order?.products?.reduce((sum, product) => 
                        sum + (product.price * product.quantity), 0).toFixed(2) || '0.00'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
                  onPress={() => confirmStatusUpdate(order, 'completed')}
                  disabled={!order?._id || order.status === 'cancelled' || order.status === 'completed'}
                >
                  <Text style={styles.buttonText}>Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
                  onPress={() => confirmStatusUpdate(order, 'cancelled')}
                  disabled={!order?._id || order.status === 'cancelled' || order.status === 'completed'}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Status Update</Text>
            <Text style={styles.modalText}>
              Are you sure you want to update order #{selectedOrder?._id?.slice(-6)} 
              to {pendingStatus}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleUpdateStatus}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f6ff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1a56a4',
    padding: 16,
    paddingTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  noOrders: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a2d5a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfo: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  productsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0a2d5a',
    marginBottom: 4,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    minWidth: 70,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: 70,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0a2d5a',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a56a4',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#0a2d5a',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    margin: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  confirmButton: {
    backgroundColor: '#3498db',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AdminOrders;
