import { configureStore } from '@reduxjs/toolkit';
import { 
  productListReducer, 
  productCreateReducer,
  productUpdateReducer,
  productDeleteReducer,
  productReviewsReducer,
  productReviewReducer
} from '../Reducers/productReducers';
import authReducer from '../Reducers/Auth.reducer';
import { cartReducer } from '../Reducers/cartReducers';

const preloadedState = {
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
  },
  cart: {
    cartItems: [],
    loading: false,
    error: null,
    cartCount: 0,
    orderCount: 0,
    orderList: [],
    selectedOrders: []
  },
  productList: { products: [] },
  productReviews: { reviews: [], loading: false, error: null },
  productReview: { canReview: false, loading: false, error: null }
};

// Debug middleware
const logger = store => next => action => {
  if (action.type.includes('CART') || action.type.includes('ORDER')) {
    console.log('Cart Action:', action.type, action.payload);
    console.log('Previous cart state:', store.getState().cart);
  }
  const result = next(action);
  if (action.type.includes('CART') || action.type.includes('ORDER')) {
    console.log('New cart state:', store.getState().cart);
  }
  return result;
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    productList: productListReducer,
    productReviews: productReviewsReducer,
    productReview: productReviewReducer,
    productCreate: productCreateReducer,
    productUpdate: productUpdateReducer,
    productDelete: productDeleteReducer
  },
  preloadedState,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(logger)
});

export default store;