import axios from 'axios'
// import { baseURL } from '@env'
import baseURL, { axiosConfig } from '../../assets/common/baseUrl';
import * as SecureStore from 'expo-secure-store'
import {
  ADD_TO_CART,
  UPDATE_CART_QUANTITY,
  REMOVE_FROM_CART,
  SET_CART_LOADING,
  SET_CART_ERROR,
  SET_CART_COUNT,
  SET_ORDER_COUNT,
  GET_ORDER_LIST_REQUEST,
  GET_ORDER_LIST_SUCCESS,
  GET_ORDER_LIST_FAIL
} from '../Constants/CartConstants'

export const addToCart = (productId, quantity) => async (dispatch) => {
  try {
    dispatch({ type: SET_CART_LOADING, payload: true });
    
    const token = await SecureStore.getItemAsync('jwt');
    console.log('Cart - Using token:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      throw new Error('Authentication token not found. Please login again.');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.post(
      `${baseURL}/add-to-orderlist`,
      {
        product_id: productId,
        quantity
      },
      config
    );

    dispatch({
      type: ADD_TO_CART,
      payload: response.data.order
    });
    
    dispatch(fetchCartCount());

    return { success: true };
  } catch (error) {
    console.error('Cart - Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    const errorMsg = error.message || error.response?.data?.message || 'Failed to add to cart';
    dispatch({
      type: SET_CART_ERROR,
      payload: errorMsg
    });
    return { success: false, error: errorMsg };
  } finally {
    dispatch({ type: SET_CART_LOADING, payload: false });
  }
};

export const updateCartQuantity = (orderId, quantity) => async (dispatch) => {
  try {
    dispatch({ type: SET_CART_LOADING, payload: true });
    
    const token = await SecureStore.getItemAsync("jwt");
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(
      `${baseURL}/update-order/${orderId}`,
      { quantity },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Dispatch success action with updated order
    dispatch({
      type: UPDATE_CART_QUANTITY,
      payload: response.data.order
    });

    // Refresh the cart to get updated data
    dispatch(getUserOrderList());

  } catch (error) {
    console.error('Error updating quantity:', error);
    dispatch({
      type: SET_CART_ERROR,
      payload: error.response?.data?.message || 'Failed to update quantity'
    });
    Alert.alert('Error', 'Failed to update quantity');
  } finally {
    dispatch({ type: SET_CART_LOADING, payload: false });
  }
};

export const fetchCartCount = () => async (dispatch) => {
  try {
    const token = await SecureStore.getItemAsync("jwt");
    if (!token) {
      dispatch({ type: SET_CART_COUNT, payload: 0 });
      return;
    }

    console.log('Fetching cart count with token:', token.substring(0, 20) + '...');

    const response = await axios.get(`${baseURL}/get-orderlist-count`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Cart count response:', response.data);

    dispatch({
      type: SET_CART_COUNT,
      payload: response.data.count || 0
    });
  } catch (error) {
    console.error('Failed to fetch cart count:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    dispatch({ type: SET_CART_COUNT, payload: 0 });
  }
};

export const initializeCartCount = () => async (dispatch) => {
  try {
    const token = await SecureStore.getItemAsync("jwt");
    if (!token) {
      dispatch({ type: SET_CART_COUNT, payload: 0 });
      return;
    }

    const response = await axios.get(`${baseURL}/get-orderlist-count`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    dispatch({
      type: SET_CART_COUNT,
      payload: response.data.count || 0
    });
  } catch (error) {
    console.error('Failed to initialize cart count:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    dispatch({ type: SET_CART_COUNT, payload: 0 });
  }
};

export const fetchOrderCount = () => async (dispatch) => {
  try {
    const token = await SecureStore.getItemAsync("jwt");
    if (!token) {
      dispatch({ type: SET_ORDER_COUNT, payload: 0 });
      return;
    }

    const response = await axios.get(`${baseURL}/get-orderlist-count`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
      }
    });

    dispatch({
      type: SET_ORDER_COUNT,
      payload: response.data.count || 0
    });
  } catch (error) {
    console.error('Failed to fetch order count:', error);
    dispatch({ type: SET_ORDER_COUNT, payload: 0 });
  }
};

export const getUserOrderList = () => async (dispatch) => {
  try {
    dispatch({ type: GET_ORDER_LIST_REQUEST });
    
    const token = await SecureStore.getItemAsync('jwt');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Fetching cart with token:', token.substring(0, 20) + '...');
    
    const response = await axios.get(`${baseURL}/user-orderlist`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Cart API response:', response.data);

    if (!response.data.orders) {
      throw new Error('Invalid response format');
    }

    dispatch({
      type: GET_ORDER_LIST_SUCCESS,
      payload: response.data.orders
    });

  } catch (error) {
    console.error('Cart fetch error:', error);
    dispatch({
      type: GET_ORDER_LIST_FAIL,
      payload: error.message
    });
  }
};

export const clearCartData = () => (dispatch) => {
  try {
    dispatch({ type: 'CLEAR_CART_DATA' });
    dispatch({ type: SET_CART_COUNT, payload: 0 });
  } catch (error) {
    console.error('Error clearing cart data:', error);
  }
};

export const removeFromCart = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: SET_CART_LOADING, payload: true });
    
    const token = await SecureStore.getItemAsync("jwt");
    if (!token) {
      throw new Error('Authentication token not found');
    }

    await axios.delete(`${baseURL}/delete-order/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    dispatch({
      type: REMOVE_FROM_CART,
      payload: orderId
    });

    // Refresh cart count after removal
    dispatch(fetchCartCount());

  } catch (error) {
    dispatch({
      type: SET_CART_ERROR,
      payload: error.response?.data?.message || 'Failed to remove item'
    });
  } finally {
    dispatch({ type: SET_CART_LOADING, payload: false });
  }
};