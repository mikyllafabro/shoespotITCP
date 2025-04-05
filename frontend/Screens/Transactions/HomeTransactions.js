import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import axios from 'axios';
import baseURL from '../../assets/common/baseUrl';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import ReviewModal from '../Modals/ReviewModal';

const HomeTransactions = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchTransactions = async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt');
      if (!token) {
        setError('Please login to view transactions');
        setLoading(false);
        return;
      }

      console.log('Fetching transactions with token:', token);

      // Remove the extra /api/v1 from the URL since it's already in baseURL
      const response = await axios.get(`${baseURL}/order/me`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Transaction response:', response.data);

      if (response.data.success) {
        // Process the order items to ensure product ID is included
        const processedOrders = response.data.orders.map(order => {
          const processedItems = order.orderItems.map(item => {
            // First check if product is an object with _id
            if (item.product && typeof item.product === 'object' && item.product._id) {
              return { ...item, productId: item.product._id };
            }
            // Then check if product is a string (ID)
            else if (item.product && typeof item.product === 'string') {
              return { ...item, productId: item.product };
            }
            return item;
          });
          
          return { ...order, orderItems: processedItems };
        });
        
        setTransactions(processedOrders);
        setError(null);
      } else {
        setError('No transactions found');
      }
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Add a function to find product ID from the raw API response
  const getProductIdFromOrderItem = (item) => {
    // Log full item for debugging
    console.log('Item structure:', JSON.stringify(item));
    
    // Try all possible locations where product ID might be
    if (item._id) return item._id;
    if (item.product) return item.product;
    if (item.productId) return item.productId;
    
    // If we can't find it, try to get it from the item name
    // This requires modifying your backend to include product ID in responses
    return null;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#2ecc71';
      case 'processing':
        return '#f1c40f';
      case 'shipped':
        return '#3498db';
      case 'cancelled':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* Review Modal */}
      {selectedProduct && (
        <ReviewModal 
          visible={isReviewModalVisible}
          onClose={() => {
            setReviewModalVisible(false);
            setSelectedProduct(null);
          }}
          productId={selectedProduct._id || selectedProduct.product}
          productName={selectedProduct.name}
          productImage={selectedProduct.image}
        />
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a56a4" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView 
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={styles.scrollView}
        >
          {transactions.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.noTransactionsText}>No orders found</Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction._id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.orderId}>Order #{transaction._id.slice(-8)}</Text>
                  <Text 
                    style={[
                      styles.status,
                      { color: getStatusColor(transaction.orderStatus) }
                    ]}
                  >
                    {transaction.orderStatus}
                  </Text>
                </View>

                <Text style={styles.date}>
                  Ordered on {formatDate(transaction.createdAt)}
                </Text>

                <View style={styles.itemsContainer}>
                  {transaction.orderItems.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      {item.image && (
                        <Image 
                          source={{ uri: item.image }}
                          style={styles.itemImage}
                          defaultSource={require('../../assets/logo.png')}
                        />
                      )}
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                      <Text style={styles.itemPrice}>₱{item.price.toFixed(2)}</Text>
                      <TouchableOpacity
                        style={[
                          styles.reviewButton,
                          transaction.orderStatus.toLowerCase() !== 'completed' && styles.disabledReviewButton
                        ]}
                        onPress={() => {
                          // Only allow reviews for completed orders
                          if (transaction.orderStatus.toLowerCase() !== 'completed') {
                            Alert.alert(
                              'Cannot Review Yet',
                              'You can only review products from completed orders.',
                              [{ text: 'OK' }]
                            );
                            return;
                          }
                          
                          // Look for the product ID or fetch it if missing
                          console.log('Order item:', JSON.stringify(item));
                          
                          // If we don't have a product ID, fetch it by name
                          const fetchProductIdByName = async (productName) => {
                            try {
                              const token = await SecureStore.getItemAsync('jwt');
                              console.log(`Fetching product ID for: ${productName}`);
                              
                              // Use the product API search feature to find the product
                              const response = await axios.get(
                                `${baseURL}/products?keyword=${encodeURIComponent(productName)}`,
                                {
                                  headers: { 
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  }
                                }
                              );
                              
                              console.log('Product search response:', response.data);
                              
                              // Find the matching product
                              if (response.data.success && response.data.products && response.data.products.length > 0) {
                                // Try to find an exact match by name
                                const exactMatch = response.data.products.find(
                                  p => p.name.toLowerCase() === productName.toLowerCase()
                                );
                                
                                if (exactMatch) {
                                  console.log(`Found exact match for ${productName}:`, exactMatch._id);
                                  return exactMatch._id;
                                }
                                
                                // If no exact match, use the first result
                                console.log(`Using first result for ${productName}:`, response.data.products[0]._id);
                                return response.data.products[0]._id;
                              }
                              
                              return null;
                            } catch (error) {
                              console.error('Error fetching product ID:', error);
                              return null;
                            }
                          };
                          
                          // Check if we already have the product ID
                          let productId = null;
                          if (item.productId) {
                            productId = item.productId;
                          } else if (item.product) {
                            productId = typeof item.product === 'object' ? item.product._id : item.product;
                          }
                          
                          // If we don't have the product ID, open the review modal after fetching it
                          if (!productId) {
                            // Remove the alert dialog and fetch the ID directly
                            const fetchIdAndOpenModal = async () => {
                              const fetchedId = await fetchProductIdByName(item.name);
                              if (fetchedId) {
                                const productToReview = {
                                  _id: fetchedId,
                                  name: item.name,
                                  image: item.image
                                };
                                console.log('Product to review with fetched ID:', productToReview);
                                setSelectedProduct(productToReview);
                                setReviewModalVisible(true);
                              } else {
                                Alert.alert('Error', 'Could not find product to review. Please try again later.');
                              }
                            };
                            fetchIdAndOpenModal();
                          } else {
                            // We already have the product ID, so proceed directly
                            console.log('Using productId:', productId);
                            const productToReview = {
                              _id: productId,
                              name: item.name,
                              image: item.image
                            };
                            setSelectedProduct(productToReview);
                            setReviewModalVisible(true);
                          }
                        }}
                      >
                        <Text style={styles.reviewButtonText}>Review</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalAmount}>
                    ₱{transaction.totalPrice.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f6ff',
  },
  header: {
    backgroundColor: '#1a56a4',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 45,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a56a4',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
  },
  itemPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  reviewButton: {
    backgroundColor: '#1a56a4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a56a4',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
  },
  noTransactionsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  disabledReviewButton: {
    backgroundColor: '#ccc',
  },
});

export default HomeTransactions;
