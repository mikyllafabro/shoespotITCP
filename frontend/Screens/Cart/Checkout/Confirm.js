import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, Image, Dimensions, ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfile } from '../../../Context/Actions/Auth.actions';
import axios from 'axios';
import baseUrl from '../../../assets/common/baseUrl';
import { clearCart, removeFromCart } from '../../../Context/Actions/cartActions'; // Change from clearCartData to clearCart
import { placeOrder } from '../../../Context/Actions/orderActions';
import * as SecureStore from 'expo-secure-store';

const SHIPPING_FEE = 50;
const windowWidth = Dimensions.get('window').width;

const Confirm = ({ navigation }) => {
  const dispatch = useDispatch();
  const [userData, setUserData] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const selectedOrders = useSelector(state => state.cart.selectedOrders || []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await SecureStore.getItemAsync('jwt');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch user data from MongoDB
        const response = await axios.get(`${baseUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const mongoUser = response.data.user;
        console.log('MongoDB User Data:', mongoUser);

        setUserData({
          ...mongoUser,
          username: mongoUser.name,
          mobileNumber: mongoUser.mobileNumber || null,
          address: mongoUser.address || null
        });

        if (!mongoUser.mobileNumber || !mongoUser.address) {
          Alert.alert(
            'Missing Information',
            'Please update your profile with mobile number and address.',
            [
              {
                text: 'Update Profile',
                onPress: () => navigation.navigate('Profile') // You'll need to create this screen
              },
              {
                text: 'Cancel',
                style: 'cancel'
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load user information');
      }
    };

    fetchUserData();
  }, [navigation]);

  if (!userData) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const calculateItemTotal = (item) => {
    const price = item.product.discountedPrice || item.product.price;
    return price * item.quantity;
  };

  const calculateSubtotal = () => {
    return selectedOrders.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + SHIPPING_FEE;
  };

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        userId: userData._id,
        products: selectedOrders.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        paymentMethod: selectedPayment
      };

      const token = await SecureStore.getItemAsync('jwt');
      const response = await axios.post(
        `${baseUrl}/order/place-order`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.order) {
        // Only remove the ordered items from cart
        const productIdsToRemove = selectedOrders.map(item => item.productId);
        for (const productId of productIdsToRemove) {
          await dispatch(removeFromCart(productId));
        }

        Alert.alert(
          'Success',
          'Order placed successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Cart')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Order placement error:', error.response?.data || error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderOrderItems = () => (
    <View style={styles.orderSection}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      {selectedOrders.map((item, index) => (
        <View key={`order-${item.productId}-${index}`} style={styles.orderItem}>
          <Image 
            source={{ uri: item.product.image }}
            style={styles.productImage}
            defaultSource={require('../../../assets/logo.png')}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.product.name}</Text>
            <Text style={styles.productDesc} numberOfLines={2}>
              {item.product.description}
            </Text>
            <View style={styles.priceRow}>
              <Text>Quantity: {item.quantity}</Text>
              <Text style={styles.itemTotal}>
                ₱{(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderPaymentMethods = () => (
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <View style={styles.paymentOptions}>
        <TouchableOpacity 
          style={[
            styles.paymentOption,
            selectedPayment === 'cash_on_delivery' && styles.selectedPayment
          ]}
          onPress={() => setSelectedPayment('cash_on_delivery')}
        >
          <Image 
            source={require('../../../assets/cod.png')}
            style={styles.paymentIcon}
          />
          <Text>Cash on Delivery</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.paymentOption,
            selectedPayment === 'credit_card' && styles.selectedPayment
          ]}
          onPress={() => setSelectedPayment('credit_card')}
        >
          <Image 
            source={require('../../../assets/cc.png')}
            style={styles.paymentIcon}
          />
          <Text>Credit Card</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.paymentOption,
            selectedPayment === 'gcash' && styles.selectedPayment
          ]}
          onPress={() => setSelectedPayment('gcash')}
        >
          <Image 
            source={require('../../../assets/gcas.png')}
            style={styles.paymentIcon}
          />
          <Text>GCash</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBottomNav = () => (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[
          styles.nextButton,
          (!userData?.mobileNumber || !userData?.address || !selectedPayment || isProcessing) && 
          styles.nextButtonDisabled
        ]}
        onPress={handlePlaceOrder}
        disabled={!userData?.mobileNumber || !userData?.address || !selectedPayment || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextButtonText}>
            {isProcessing ? 'Processing...' : 'Place Order'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.totalSection}>
      <View key="summary-subtotal" style={styles.totalRow}>
        <Text>Subtotal:</Text>
        <Text>₱{calculateSubtotal().toFixed(2)}</Text>
      </View>
      <View key="summary-shipping" style={styles.totalRow}>
        <Text>Shipping Fee:</Text>
        <Text>₱{SHIPPING_FEE.toFixed(2)}</Text>
      </View>
      <View key="summary-total" style={[styles.totalRow, styles.grandTotal]}>
        <Text style={styles.grandTotalText}>Total:</Text>
        <Text style={styles.grandTotalAmount}>
          ₱{calculateGrandTotal().toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{userData.username}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{userData.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Mobile:</Text>
            <Text style={styles.value}>{userData.mobileNumber || 'Not provided'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{userData.address || 'Not provided'}</Text>
          </View>
        </View>

        {renderOrderItems()}
        {renderPaymentMethods()}
        {renderSummary()}
      </ScrollView>

      {renderBottomNav()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    width: 100,
    fontWeight: '600',
  },
  value: {
    flex: 1,
  },
  bottomNav: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  nextButton: {
    backgroundColor: '#1a56a4', // Changed from #ff9900 to blue
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.8,
  },
  orderSection: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  orderItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productDesc: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a56a4', // Changed from #ff9900
  },
  paymentSection: {
    padding: 15,
    backgroundColor: '#fff',
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  paymentOption: {
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: windowWidth / 3.5,
  },
  selectedPayment: {
    borderColor: '#1a56a4', // Changed from #ff9900
    backgroundColor: '#e6f0ff', // Lighter blue background
  },
  paymentIcon: {
    width: 30,
    height: 30,
    marginBottom: 5,
    resizeMode: 'contain',
  },
  totalSection: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
    paddingTop: 10,
  },
  grandTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a56a4', // Changed from #ff9900
  }
});

export default Confirm;