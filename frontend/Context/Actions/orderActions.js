import axios from 'axios';
// import { baseUrl } from '@env';
import baseURL, { axiosConfig } from '../../assets/common/baseUrl';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import {
  CREATE_ORDER_REQUEST,
  CREATE_ORDER_SUCCESS,
  CREATE_ORDER_FAIL,
  GET_USER_ORDERS_REQUEST,
  GET_USER_ORDERS_SUCCESS,
  GET_USER_ORDERS_FAIL,
  SET_SELECTED_ITEMS,
  SET_PAYMENT_METHOD
} from '../Constants/OrderConstants';
import { clearCartData } from './cartActions';

export const createOrder = (orderData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_ORDER_REQUEST });
    
    const token = await SecureStore.getItemAsync("jwt");
    if (!token) throw new Error('No authentication token found');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.post(
      `${baseURL}/place-order`,
      orderData,
      config
    );

    dispatch({
      type: CREATE_ORDER_SUCCESS,
      payload: response.data.order
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: CREATE_ORDER_FAIL,
      payload: error.response?.data?.message || error.message
    });
    throw error;
  }
};

export const setSelectedItems = (selectedOrderIds) => async (dispatch) => {
  try {
    console.log('Fetching details for selected orders:', selectedOrderIds);

    const token = await SecureStore.getItemAsync("jwt");
    if (!token) throw new Error('No authentication token found');

    // Fetch full order details for selected items
    const response = await axios.post(
      `${baseURL}/get-selected-orders`,
      { orderIds: selectedOrderIds },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Selected orders with details:', response.data);

    return dispatch({
      type: SET_SELECTED_ITEMS,
      payload: response.data.orders
    });
  } catch (error) {
    console.error('Error in setSelectedItems:', error);
    throw error;
  }
};

export const processOrder = (orderDetails) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_ORDER_REQUEST });
    
    const token = await SecureStore.getItemAsync("jwt");
    if (!token) throw new Error('No authentication token found');

    // 1. Create the order
    const orderResponse = await axios.post(
      `${baseURL}/place-order`,
      orderDetails,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 2. Delete processed items from orderlist
    await axios.post(
      `${baseURL}/cleanup-orderlist`,
      { orderIds: orderDetails.orderIds },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    dispatch({
      type: CREATE_ORDER_SUCCESS,
      payload: orderResponse.data.order
    });

    return orderResponse.data;
  } catch (error) {
    dispatch({
      type: CREATE_ORDER_FAIL,
      payload: error.response?.data?.message || error.message
    });
    throw error;
  }
};

export const setPaymentMethod = (method) => ({
  type: SET_PAYMENT_METHOD,
  payload: method
});

export const placeOrder = (orderData, navigation) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_ORDER_REQUEST });
    const token = await SecureStore.getItemAsync("jwt");
    const userDataStr = await SecureStore.getItemAsync("user");

    if (!token || !userDataStr) {
      throw new Error('Authentication token or user data not found');
    }

    const userData = JSON.parse(userDataStr);
    console.log('Processing order with user data:', userData);

    const userId = userData._id || userData.id;
    if (!userId) {
      throw new Error('User ID is missing from stored data');
    }

    // Format order data
    const formattedOrderData = {
      ...orderData,
      userId: userId,
      products: orderData.products.map(product => ({
        productId: product.productId,
        quantity: product.quantity
      }))
    };

    console.log('Submitting order:', formattedOrderData);

    const orderResponse = await axios.post(
      `${baseURL}/place-order`,
      formattedOrderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Order response:', orderResponse.data);

    dispatch({ 
      type: CREATE_ORDER_SUCCESS, 
      payload: orderResponse.data.order 
    });
    
    // Clear cart and navigate home
    dispatch(clearCartData());
    
    Alert.alert(
      'Success',
      'Order placed successfully!',
      [{ 
        text: 'OK',
        onPress: () => navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }]
        })
      }]
    );

  } catch (error) {
    console.error('Order placement failed:', error);
    dispatch({
      type: CREATE_ORDER_FAIL,
      payload: error.message || 'Failed to place order'
    });
    Alert.alert('Error', 'Failed to place order. Please try again.');
  }
};