import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { cartReducer } from '../Reducers/cartReducers';
import { productListReducer } from '../Reducers/productReducers';
import { productReviewsReducer } from '../Reducers/productReviewsReducer';
import { orderReducer } from '../Reducers/orderReducers';
import { authReducer } from '../Reducers/authReducers';

const initialState = {
  cart: {
    cartItems: [],
    loading: false,
    error: null,
    cartCount: 0,
    orderCount: 0,
    orderList: []
  },
  auth: {
    user: null,
    isAuthenticated: false,
    loading: false,
    token: null,
    error: null
  },
  productList: { loading: false, products: [] },
  productReviews: { loading: false, reviews: [], error: null },
  order: {
    loading: false,
    error: null,
    selectedItems: [],
    paymentMethod: null,
    orders: [],
    currentOrder: null,
    taxRate: 0.12
  }
};

const rootReducer = combineReducers({
  cart: cartReducer,
  auth: authReducer,
  productList: productListReducer,
  productReviews: productReviewsReducer,
  order: orderReducer
});

// Debug middleware
const loggerMiddleware = store => next => action => {
  console.log('Cart Action:', action.type, action.payload);
  const prevState = store.getState().cart;
  const result = next(action);
  const nextState = store.getState().cart;
  console.log('Cart State Change:', {
    prev: prevState,
    next: nextState
  });
  return result;
};

const store = createStore(
  rootReducer,
  initialState,
  applyMiddleware(thunk, loggerMiddleware)
);

// Add debugging
store.subscribe(() => {
  const state = store.getState();
//   console.log('Store Updated - Full State:', state);
//   console.log('Store Updated - Cart State:', {
//     cartCount: state.cart?.cartCount,
//     orderCount: state.cart?.orderCount
//   });
});

export default store;