import {
  SET_CART_LOADING,
  SET_CART_ERROR,
  SET_CART_ITEMS,
  SET_CART_COUNT,
  CLEAR_CART
} from '../Constants/CartConstants'
import {
  initDatabase,
  saveCartItem,
  getCartItems,
  updateCartItemQuantity,
  deleteCartItem,
  clearCartItems,
  getCartItemCount,
  deleteMultipleCartItems
} from '../../services/database'

export const addToCart = (product, quantity = 1) => async (dispatch) => {
  try {
    dispatch({ type: SET_CART_LOADING, payload: true });
    
    // Ensure database is initialized before proceeding
    await initDatabase();
    
    // Transform the product data to match database structure
    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      discountedPrice: product.discountedPrice || product.price,
      images: product.images
    };
    
    await saveCartItem(cartItem, quantity);
    const items = await getCartItems();
    dispatch({ type: SET_CART_ITEMS, payload: items });
    const count = await getCartItemCount();
    dispatch({ type: SET_CART_COUNT, payload: count });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding to cart:', error);
    dispatch({ type: SET_CART_ERROR, payload: error.message });
    return { success: false, error: error.message };
  } finally {
    dispatch({ type: SET_CART_LOADING, payload: false });
  }
};

export const updateQuantity = (productId, quantity) => async (dispatch) => {
  try {
    dispatch({ type: SET_CART_LOADING, payload: true });
    await updateCartItemQuantity(productId, quantity);
    const items = await getCartItems();
    dispatch({ type: SET_CART_ITEMS, payload: items });
    const count = await getCartItemCount();
    dispatch({ type: SET_CART_COUNT, payload: count });
  } catch (error) {
    dispatch({ type: SET_CART_ERROR, payload: error.message });
  } finally {
    dispatch({ type: SET_CART_LOADING, payload: false });
  }
};

export const removeFromCart = (productId) => async (dispatch) => {
  try {
    dispatch({ type: SET_CART_LOADING, payload: true });
    await deleteCartItem(productId);
    const items = await getCartItems();
    dispatch({ type: SET_CART_ITEMS, payload: items });
    const count = await getCartItemCount();
    dispatch({ type: SET_CART_COUNT, payload: count });
  } catch (error) {
    dispatch({ type: SET_CART_ERROR, payload: error.message });
  } finally {
    dispatch({ type: SET_CART_LOADING, payload: false });
  }
};

export const removeMultipleFromCart = (productIds) => async (dispatch) => {
  try {
    dispatch({ type: SET_CART_LOADING, payload: true });
    await deleteMultipleCartItems(productIds);
    const items = await getCartItems();
    dispatch({ type: SET_CART_ITEMS, payload: items });
    const count = await getCartItemCount();
    dispatch({ type: SET_CART_COUNT, payload: count });
  } catch (error) {
    dispatch({ type: SET_CART_ERROR, payload: error.message });
  } finally {
    dispatch({ type: SET_CART_LOADING, payload: false });
  }
};

export const clearCart = () => async (dispatch) => {
  try {
    dispatch({ type: SET_CART_LOADING, payload: true });
    await clearCartItems();
    dispatch({ type: CLEAR_CART });
  } catch (error) {
    dispatch({ type: SET_CART_ERROR, payload: error.message });
  } finally {
    dispatch({ type: SET_CART_LOADING, payload: false });
  }
};

export const loadCartItems = () => async (dispatch) => {
  try {
    dispatch({ type: SET_CART_LOADING, payload: true });
    await initDatabase();
    const items = await getCartItems();
    dispatch({ type: SET_CART_ITEMS, payload: items });
    const count = await getCartItemCount();
    dispatch({ type: SET_CART_COUNT, payload: count });
  } catch (error) {
    dispatch({ type: SET_CART_ERROR, payload: error.message });
  } finally {
    dispatch({ type: SET_CART_LOADING, payload: false });
  }
};