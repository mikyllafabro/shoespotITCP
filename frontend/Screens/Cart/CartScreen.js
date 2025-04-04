import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { loadCartItems, removeFromCart, updateQuantity } from '../../Context/Actions/cartActions';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import baseUrl from '../../assets/common/baseUrl';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { setSelectedItems } from '../../Context/Actions/cartActions';
import { createSelector } from 'reselect';

const CartScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);

  // Update to use cartItems instead of orderList
  const { cartItems, loading: cartLoading, error } = useSelector(state => ({
    cartItems: state.cart?.cartItems || [],
    loading: state.cart?.loading || false,
    error: state.cart?.error || null
  }));

  useEffect(() => {
    const loadCart = async () => {
      try {
        await dispatch(loadCartItems());
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };

    loadCart();
  }, [dispatch]);

  // Debug log for cart state
  useEffect(() => {
    console.log('Current cart state:', {
      cartItems,
      itemCount: cartItems?.length,
      loading: cartLoading,
      error
    });
  }, [cartItems, cartLoading, error]);

  const handleQuantityUpdate = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      Alert.alert('Invalid Quantity', 'Quantity must be greater than 0');
      return;
    }
    
    try {
      setLoading(true);
      await dispatch(updateQuantity(productId, newQuantity));
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (productId) => {
    setSelectedItems(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      if (selectedItems[item.product_id]) {
        return total + (item.product_price * item.quantity);
      }
      return total;
    }, 0);
  };

  const handleDelete = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleOrderNow = () => {
    try {
      const selectedOrderIds = Object.keys(selectedItems).filter(productId => selectedItems[productId]);
      
      if (selectedOrderIds.length === 0) {
        Alert.alert('Error', 'Please select at least one item');
        return;
      }

      const selectedOrders = cartItems
        .filter(item => selectedItems[item.product_id])
        .map(item => ({
          productId: item.product_id, // Simplified product ID
          quantity: item.quantity,
          // Include product details for display purposes
          product: {
            _id: item.product_id,
            name: item.product_name,
            price: item.product_price,
            image: item.product_image
          }
        }));
      
      dispatch({
        type: 'SET_SELECTED_ORDERS',
        payload: selectedOrders
      });

      navigation.navigate('Confirm');
    } catch (error) {
      console.error('handleOrderNow - Error:', error);
      Alert.alert('Error', 'Something went wrong while processing your order.');
    }
  };

  // Add this helper function to check if any items are selected
  const hasSelectedItems = () => {
    return Object.values(selectedItems).some(isSelected => isSelected);
  };

  const renderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleItemSelection(item.product_id)}
      >
        <Ionicons
          name={selectedItems[item.product_id] ? "checkbox" : "square-outline"}
          size={24}
          color="#1a56a4" // Changed from #ff9900
        />
      </TouchableOpacity>
      
      {item.product_image ? (
        <Image 
          source={{ uri: item.product_image }} 
          style={styles.productImage}
          defaultSource={require('../../assets/logo.png')}
        />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]} />
      )}
      
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <TouchableOpacity 
            onPress={() => handleDelete(item.product_id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.productPrice}>₱{item.product_price}</Text>
        
        <View style={styles.quantityControl}>
          <TouchableOpacity 
            style={[
              styles.quantityButton,
              item.quantity <= 1 && styles.quantityButtonDisabled
            ]}
            disabled={item.quantity <= 1}
            onPress={() => handleQuantityUpdate(item.product_id, item.quantity - 1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityUpdate(item.product_id, item.quantity + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (cartLoading || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff9900" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={item => item.product_id?.toString()}
        ListEmptyComponent={
          <View style={styles.emptyCart}>
            <Text>No items in cart</Text>
          </View>
        }
      />

      <View style={styles.bottomNav}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₱{calculateTotal().toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.orderButton,
            !hasSelectedItems() && styles.orderButtonDisabled
          ]}
          disabled={!hasSelectedItems()}
          onPress={handleOrderNow}
        >
          <Text style={[
            styles.orderButtonText,
            !hasSelectedItems() && styles.orderButtonTextDisabled
          ]}>
            Order Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  orderItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 10,
    color: '#1a56a4', // Changed color
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    marginLeft: 16,
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 16,
    color: '#ff9900',
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 16,
    color: '#1a56a4', // Changed from #ff9900
    fontWeight: 'bold',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#333',
  },
  quantityText: {
    marginHorizontal: 15,
    fontSize: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  bottomNav: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 30,
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1a56a4', // Changed from #ff9900
  },
  orderButton: {
    backgroundColor: '#1a56a4', // Changed from #ff9900
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  orderButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.8,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderButtonTextDisabled: {
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default CartScreen;