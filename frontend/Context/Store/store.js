import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import authReducer from '../Reducers/Auth.reducer';
import { productListReducer } from '../Reducers/productReducers';
import { cartReducer } from '../Reducers/cartReducers';
import { composeWithDevTools } from 'redux-devtools-extension';

const rootReducer = combineReducers({
  auth: authReducer,
  productList: productListReducer,
  cart: cartReducer,  // Add cart reducer
});

const initialState = {
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
  }
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

const store = createStore(
  rootReducer,
  initialState,
  composeWithDevTools(applyMiddleware(thunk, logger))
);

export default store;